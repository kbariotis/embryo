import { chat } from './llm.js';
import chalk from 'chalk';
import { getSystemPrompt } from './prompt.js';
import inquirer from 'inquirer';


export async function runAgent(userInput, tools, spinner, signal) {
  const systemPromptWithTime = getSystemPrompt();

  let messages = [{ role: 'user', parts: [{ text: userInput }] }];
  let iterations = 0;
  const maxIterations = 15;

  while (iterations < maxIterations) {
    if (signal?.aborted) {
      throw new Error('Task aborted by user');
    }

    const response = await chat(messages, systemPromptWithTime, signal);
    
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
      
      let observation;

      if (toolName === 'execute_command') {
        if (spinner) spinner.stop();
        const { confirmed } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmed',
            message: chalk.red.bold(`Allow host command: ${argsRaw}?`),
            default: false
          }
        ]);
        if (spinner) spinner.start();

        if (!confirmed) {
          observation = "User rejected the command. Please try an alternative approach or use the sandbox if appropriate.";
        }
      }

      if (!observation) {
        if (signal?.aborted) {
          throw new Error('Task aborted by user');
        }

        const tool = tools[toolName];
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
              observation = await tool(args, signal);
            }
          } catch (error) {
            observation = `Error executing ${toolName}: ${error.message}`;
          }
        } else {
          observation = `Tool ${toolName} not found.`;
        }
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
