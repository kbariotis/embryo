import { chat } from './llm.js';
import chalk from 'chalk';
import { getSystemPrompt } from './prompt.js';


export async function runAgent(userInput, tools) {
  const systemPromptWithTime = getSystemPrompt();

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
