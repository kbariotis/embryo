import { chat } from './llm.js';
import chalk from 'chalk';

const SYSTEM_PROMPT = `
You are Orbital, a local AI assistant. You help the user by executing shell commands and browsing the web.
You use a ReAct (Reasoning + Acting) loop.

TOOLS:
1. execute_command({"command": "ls"}): Runs a shell command.
2. write_file({"filename": "out.txt", "content": "hello"}): Saves content to a file.
3. list_files({"directory": "."}): Lists files in a directory.
4. browser_open({"url": "google.com"}): Opens a URL.
5. browser_click({"selector": "button"}): Clicks an element.
6. browser_type({"selector": "input", "text": "hello"}): Types into an input.
7. browser_get_content({}): Returns the text content of the current page.

RULES:
- You MUST follow this EXACT format for EVERY turn:
Thought: <your reasoning about what to do next>
Action: tool_name({"arg1": "val1", "arg2": "val2"})

- The arguments MUST be a valid JSON object.
- Once you have performed the action, wait for the Observation.
- ONLY when you have the final evidence from Observations, use:
Answer: <your final response to the user>

CRITICAL:
- NEVER hallucinate results. NEVER say you have done something unless you actually called the Action in the previous turn and received a Success Observation.
- You do not know the weather, news, or any external state without using tools.
- Every turn must have EITHER an Action OR an Answer. NEVER both in the same turn.
- SEARCHING: Google often blocks automated tools with CAPTCHAs. For web searches, ALWAYS use DuckDuckGo (e.g., browser_open({"url": "https://duckduckgo.com/?q=your+query"})).
`;

export async function runAgent(userInput, tools) {
  let messages = [{ role: 'user', parts: [{ text: userInput }] }];
  let iterations = 0;
  const maxIterations = 15;

  while (iterations < maxIterations) {
    const response = await chat(messages, SYSTEM_PROMPT);
    
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
