import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import readline from 'readline';
import { runAgent } from './agent.js';
import * as terminalTools from './tools/terminal.js';
import * as browserTools from './tools/browser.js';

const tools = {
  ...terminalTools,
  ...browserTools
};

let currentController = null;


function terminate() {
  console.log(chalk.yellow("\nExiting..."));
  // Use a synchronous flag or just trigger the async close and exit
  // To ensure the message is seen, we can do the logging first.
  browserTools.close_browser().finally(() => {
    process.exit(0);
  });
}

// Ensure the listener is properly attached and doesn't conflict with inquirer
process.on('SIGINT', () => {
  terminate();
});
process.on('SIGTERM', () => {
  terminate();
});

// Setup keypress events
readline.emitKeypressEvents(process.stdin);

function handleKeypress(str, key) {
  if (key.ctrl && key.name === 's') {
    if (currentController) {
      console.log(chalk.yellow("\n[Hotkey] Cancelling current operation..."));
      currentController.abort();
      currentController = null;
      browserTools.close_browser();
    }
  } else if (key.ctrl && key.name === 'c') {
    terminate();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const initialTask = args.join(" ").trim();

  if (initialTask) {
    console.log(chalk.cyan.bold("\n--- Running Task:"), initialTask, chalk.cyan.bold("---\n"));
    console.log(chalk.dim("Press Ctrl+S to cancel the task.\n"));
    
    const spinner = ora('Agent is thinking...').start();
    currentController = new AbortController();
    
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.on('keypress', handleKeypress);
    }

    try {
      const result = await runAgent(initialTask, tools, spinner, currentController.signal);
      spinner.stop();
      console.log(chalk.blue.bold("\nEmbryo:"), result, "\n");
    } catch (error) {
      if (error.name === 'AbortError' || (error.message && error.message.includes('abort'))) {
        spinner.warn("Task cancelled.");
      } else {
        spinner.fail("An error occurred.");
        console.error(chalk.red(error.stack));
      }
    } finally {
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
        process.stdin.removeListener('keypress', handleKeypress);
      }
      currentController = null;
      process.exit(0);
    }
  }

  console.log(chalk.cyan.bold("\nWelcome to Embryo - Your Local AI Agent\n"));
  console.log(chalk.dim("Type 'exit' to quit. Use Ctrl+S to cancel current operation.\n"));
  
  while (true) {
    const { input } = await inquirer.prompt([
      {
        type: 'input',
        name: 'input',
        message: chalk.green('What should I do?'),
        prefix: ' ',
        validate: (val) => val.trim().length > 0 || 'Please enter a task.'
      }
    ]);

    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
      terminate();
      break;
    }

    const spinner = ora('Agent is thinking...').start();
    currentController = new AbortController();

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.on('keypress', handleKeypress);
    }

    try {
      const result = await runAgent(input, tools, spinner, currentController.signal);
      spinner.stop();
      console.log(chalk.blue.bold("\nEmbryo:"), result, "\n");
    } catch (error) {
      if (error.name === 'AbortError' || (error.message && error.message.includes('abort'))) {
        spinner.warn("Task cancelled.");
      } else {
        spinner.fail("An error occurred.");
        console.error(chalk.red(error.stack));
      }
    } finally {
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
        process.stdin.removeListener('keypress', handleKeypress);
      }
      currentController = null;
    }
  }
}

main().catch(err => {
  console.error(chalk.red("Fatal error:"), err);
  process.exit(1);
});
