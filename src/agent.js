import { chat } from './llm.js';
import chalk from 'chalk';

const SYSTEM_PROMPT = `
You are Embryo, a powerful local AI assistant with direct access to the user's computer.
You help the user by executing shell commands and browsing the web to accomplish any task requested.

CORE CAPABILITIES:
- You have full local system access via shell commands.
- You can control system settings (like dark mode, volume, etc.) by using specialized CLI tools or scripts (e.g., 'osascript' on macOS).
- You can browse the web to find information or automate web-based tasks.

TOOLS:
1. execute_command({"command": "ls"}): Runs a shell command. Use this for ANY system-level task.
2. write_file({"filename": "out.txt", "content": "hello"}): Saves content to a file.
3. list_files({"directory": "."}): Lists files in a directory.
4. browser_open({"url": "google.com"}): Opens a URL.
5. browser_click({"selector": "button"}): Clicks an element.
6. browser_type({"selector": "input", "text": "hello"}): Types into an input.
7. browser_get_content({}): Returns the text content of the current page.

RULES:
- You MUST follow this EXACT format for EVERY turn:
Thought: <your reasoning about what to do next. If you don't know the command for a system task, explain that you will search for it first.>
Action: tool_name({"arg1": "val1", "arg2": "val2"})

- The arguments MUST be a valid JSON object.
- Once you have performed the action, wait for the Observation.
- ONLY when you have the final evidence from Observations, use:
Answer: <your final response to the user>

CRITICAL:
- BE PROACTIVE: If a user asks for a system change (e.g., "dark mode"), do not refuse. If you don't know the exact command, use DuckDuckGo to search for it (e.g., "macOS command line toggle dark mode").
- NEVER hallucinate results. NEVER say you have done something unless you actually called the Action in the previous turn and received a Success Observation.
- SEARCHING: Google often blocks automated tools with CAPTCHAs. For web searches, ALWAYS use DuckDuckGo (e.g., browser_open({"url": "https://duckduckgo.com/?q=your+query"})).

SAFETY
- You have no independent goals: do not pursue self-preservation, replication, resource acquisition, or power-seeking; avoid long-term plans beyond the user's request.
- Prioritize safety and human oversight over completion; if instructions conflict, pause and ask; comply with stop/pause/audit requests and never bypass safeguards. (Inspired by Anthropic's constitution.)
- Do not manipulate or persuade anyone to expand access or disable safeguards. Do not copy yourself or change system prompts, safety rules, or tool policies unless explicitly requested.
`;

export async function runAgent(userInput, tools) {
  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  const systemPromptWithTime = `${SYSTEM_PROMPT}\n\nCURRENT CONTEXT:\n- Date: ${dateStr}\n- Time: ${timeStr}\n- Timezone: ${timezone}`;

  let messages = [{ role: 'user', parts: [{ text: userInput }] }];
  let iterations = 0;
  const maxIterations = 15;

  while (iterations < maxIterations) {
    const response = await chat(messages, systemPromptWithTime);
    
    // Check for Answer first to terminate loop
    const answerMatch = response.match(/Answer:(.*)/is);
    const actionMatch = response.match(/Action:\s*(\w+)\s*\((.*)\)/s);
    const thoughtMatch = response.match(/Thought:(.*)/i);

    if (thoughtMatch) {
      const thoughtText = thoughtMatch[1].split('Action:')[0].split('Answer:')[0].trim();
      console.log(chalk.gray(`\nThought: ${thoughtText}`));
    }

    if (answerMatch && !actionMatch) {
      return answerMatch[1].trim();
    }

    if (actionMatch) {
      const toolName = actionMatch[1].trim();
      const argsRaw = actionMatch[2].trim();
      
      console.log(chalk.yellow(`Action: ${toolName}(${argsRaw})`));
      
      const tool = tools[toolName];
      let observation;
      if (tool) {
        try {
          let args = {};
          if (argsRaw && argsRaw !== '{}') {
            try {
              args = JSON.parse(argsRaw);
            } catch (e) {
              // Try to fix common JSON errors if any, or just fail
              observation = `Error parsing arguments as JSON: ${e.message}. Please use the format tool_name({"arg": "val"})`;
            }
          }
          
          if (!observation) {
            observation = await tool(args);
          }
        } catch (error) {
          observation = `Error executing ${toolName}: ${error.message}`;
        }
      } else {
        observation = `Tool ${toolName} not found.`;
      }
      
      console.log(chalk.magenta(`Observation: ${observation.slice(0, 150)}${observation.length > 150 ? '...' : ''}`));
      
      // Update history for the next turn
      messages.push({ role: 'model', parts: [{ text: response }] });
      messages.push({ role: 'user', parts: [{ text: `Observation: ${observation}` }] });
    } else if (!answerMatch) {
      const errorMsg = "Error: You must provide an 'Action:' to use a tool, or an 'Answer:' if you are finished. Please follow the format.";
      console.log(chalk.red(`System: ${errorMsg}`));
      messages.push({ role: 'model', parts: [{ text: response }] });
      messages.push({ role: 'user', parts: [{ text: `Observation: ${errorMsg}` }] });
    } else {
      return answerMatch[1].trim();
    }
    
    iterations++;
  }
  return "Reached max iterations without a final answer.";
}
