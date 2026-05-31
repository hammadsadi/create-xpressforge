import { input, select, checkbox } from '@inquirer/prompts';
import chalk from 'chalk';

export async function askQuestions() {
  console.log(chalk.bold('  Let\'s configure your project:\n'));

  const projectName = await input({
    message: 'Project name:',
    default: 'my-express-app',
    validate: (val) => {
      if (!val.trim()) return 'Project name cannot be empty';
      if (!/^[a-z0-9-_]+$/.test(val)) return 'Use lowercase letters, numbers, hyphens only';
      return true;
    },
  });

  const structure = await select({
    message: 'Project structure:',
    choices: [
      { name: 'MVC          — controllers, models, views, routes', value: 'mvc' },
      { name: 'Modular      — feature-based modules (recommended for large apps)', value: 'modular' },
      { name: 'Layered      — controllers, services, repositories, models', value: 'layered' },
    ],
  });

  const database = await select({
    message: 'Database:',
    choices: [
      { name: 'MongoDB      — with Mongoose ODM', value: 'mongodb' },
      { name: 'PostgreSQL   — with Prisma ORM', value: 'postgresql' },
      { name: 'MySQL        — with Sequelize ORM', value: 'mysql' },
      { name: 'None         — no database', value: 'none' },
    ],
  });

  const auth = await select({
    message: 'Authentication:',
    choices: [
      { name: 'JWT          — access + refresh token', value: 'jwt' },
      { name: 'Session      — express-session + cookie', value: 'session' },
      { name: 'None         — skip auth setup', value: 'none' },
    ],
  });

  const extras = await checkbox({
    message: 'Extra features (space to select):',
    choices: [
      { name: 'Rate limiting       (express-rate-limit)', value: 'rateLimit', checked: true },
      { name: 'Security headers    (helmet)', value: 'helmet', checked: true },
      { name: 'CORS                (cors)', value: 'cors', checked: true },
      { name: 'Request logger      (morgan)', value: 'morgan', checked: true },
      { name: 'Input validation    (express-validator)', value: 'validation', checked: false },
      { name: 'File upload         (multer)', value: 'multer', checked: false },
      { name: 'Socket.io           (real-time)', value: 'socket', checked: false },
      { name: 'Swagger docs        (swagger-ui-express)', value: 'swagger', checked: false },
    ],
  });

  const language = await select({
    message: 'Language:',
    choices: [
      { name: 'JavaScript   — ES Modules (type: module)', value: 'js' },
      { name: 'TypeScript   — fully typed', value: 'ts' },
    ],
  });

  return { projectName, structure, database, auth, extras, language };
}
