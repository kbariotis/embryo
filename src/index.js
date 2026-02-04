import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { runAgent } from './agent.js';
import * as terminalTools from './tools/terminal.js';
import * as browserTools from './tools/browser.js';

const tools = {
  ...terminalTools,
  ...browserTools
};

async function main() {
  const args = process.argv.slice(2);
  const initialTask = args.join(" ");

  if (initialTask) {
    console.log(chalk.cyan.bold("\n--- Running Task:"), initialTask, chalk.cyan.bold("---\n"));
    const spinner = ora('Agent is thinking...').start();
    try {
      const result = await runAgent(initialTask, tools);
      spinner.stop();
      console.log(chalk.blue.bold("\nEmbryo:"), result, "\n");
    } catch (error) {
      spinner.fail("An error occurred.");
      console.error(chalk.red(error.stack));
    }
    process.exit(0);
  }

  console.log(chalk.cyan.bold("\nWelcome to Embryo - Your Local AI Agent\n"));
  console.log(chalk.dim("Type 'exit' to quit.\n"));
  
  while (true) {
    const { input } = await inquirer.prompt([
      {
        type: 'input',
        name: 'input',
        message: chalk.green('What should I do?'),
        prefix: ' '
      }
    ]);

    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
      await browserTools.close_browser();
      console.log(chalk.yellow("Goodbye!"));
      break;
    }

    const spinner = ora('Agent is thinking...').start();
    try {
      const result = await runAgent(input, tools);
      spinner.stop();
      console.log(chalk.blue.bold("\nEmbryo:"), result, "\n");
    } catch (error) {
      spinner.fail("An error occurred.");
      console.error(chalk.red(error.stack));
    }
  }
}

main().catch(err => {
  console.error(chalk.red("Fatal error:"), err);
  process.exit(1);
});
