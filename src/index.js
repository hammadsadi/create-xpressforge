import gradient from 'gradient-string';
import chalk from 'chalk';
import path from 'path';
import { askQuestions } from './prompts/questions.js';
import { generateProject } from './generators/projectGenerator.js';

export async function run() {
  console.clear();

  const banner = gradient(['#6C63FF', '#48CAE4'])(
    `
  ██╗  ██╗██████╗ ██████╗ ███████╗███████╗███████╗
  ╚██╗██╔╝██╔══██╗██╔══██╗██╔════╝██╔════╝██╔════╝
   ╚███╔╝ ██████╔╝██████╔╝█████╗  ███████╗███████╗
   ██╔██╗ ██╔═══╝ ██╔══██╗██╔══╝  ╚════██║╚════██║
  ██╔╝ ██╗██║     ██║  ██║███████╗███████║███████║
  ╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝
              F O R G E
  `
  );

  console.log(banner);
  console.log(chalk.dim('  Production-ready Node.js + Express scaffolder\n'));
  console.log(chalk.dim('  by Hammad Sadi\n'));

  try {
    const answers = await askQuestions();
    const targetDir = path.resolve(process.cwd(), answers.projectName);
    await generateProject(answers, targetDir);
  } catch (err) {
    if (err.name === 'ExitPromptError') {
      console.log(chalk.yellow('\n  Cancelled. See you next time!\n'));
      process.exit(0);
    }
    console.error(chalk.red('\n  Error: ' + err.message));
    process.exit(1);
  }
}
