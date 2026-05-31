import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { generatePackageJson } from './packageJsonGenerator.js';
import { generateEnv } from './envGenerator.js';
import { generateAppJs } from './appGenerator.js';
import { generateDbConfig } from './dbGenerator.js';
import { generateAuthFiles } from './authGenerator.js';
import { generateStructure } from './structureGenerator.js';
import { generateReadme } from './readmeGenerator.js';

export async function generateProject(answers, targetDir) {
  const spinner = ora({ text: 'Creating project...', color: 'cyan' }).start();

  try {
    // 1. Check if directory exists
    if (await fs.pathExists(targetDir)) {
      spinner.fail(chalk.red(`Directory "${answers.projectName}" already exists!`));
      process.exit(1);
    }

    await fs.ensureDir(targetDir);
    spinner.text = 'Scaffolding folder structure...';

    // 2. Generate folder structure based on chosen pattern
    await generateStructure(answers, targetDir);
    spinner.text = 'Writing configuration files...';

    // 3. package.json
    const pkg = generatePackageJson(answers);
    await fs.writeJson(path.join(targetDir, 'package.json'), pkg, { spaces: 2 });

    // 4. .env + .env.example
    const envContent = generateEnv(answers);
    await fs.writeFile(path.join(targetDir, '.env'), envContent);
    await fs.writeFile(path.join(targetDir, '.env.example'), envContent.replace(/=.+/gm, '='));

    // 5. .gitignore
    await fs.writeFile(path.join(targetDir, '.gitignore'), gitignoreContent());

    // 6. app.js / app.ts
    const appContent = generateAppJs(answers);
    const ext = answers.language === 'ts' ? 'ts' : 'js';
    await fs.writeFile(path.join(targetDir, 'src', `app.${ext}`), appContent);

    // 7. server.js entry
    await fs.writeFile(path.join(targetDir, `server.${ext}`), serverContent(answers));

    // 7b. Swagger config (only if swagger selected)
    if (answers.extras.includes('swagger')) {
      await fs.writeFile(
        path.join(targetDir, 'src', 'config', `swagger.${ext}`),
        swaggerConfigContent(answers)
      );
    }

    // 8. DB config
    if (answers.database !== 'none') {
      spinner.text = 'Setting up database connection...';
      const dbContent = generateDbConfig(answers);
      await fs.writeFile(path.join(targetDir, 'src', 'config', `db.${ext}`), dbContent);
    }

    // 9. env config
    await fs.writeFile(
      path.join(targetDir, 'src', 'config', `env.${ext}`),
      envConfigContent(answers)
    );

    // 10. Auth files
    if (answers.auth !== 'none') {
      spinner.text = 'Generating auth files...';
      await generateAuthFiles(answers, targetDir, ext);
    }

    // 11. Utils
    await fs.writeFile(
      path.join(targetDir, 'src', 'utils', `apiResponse.${ext}`),
      apiResponseContent()
    );
    await fs.writeFile(
      path.join(targetDir, 'src', 'utils', `logger.${ext}`),
      loggerContent()
    );
    await fs.writeFile(
      path.join(targetDir, 'src', 'middlewares', `errorHandler.${ext}`),
      errorHandlerContent()
    );
    await fs.writeFile(
      path.join(targetDir, 'src', 'middlewares', `notFound.${ext}`),
      notFoundContent()
    );

    // 12. TypeScript config
    if (answers.language === 'ts') {
      await fs.writeJson(path.join(targetDir, 'tsconfig.json'), tsConfig(), { spaces: 2 });
    }

    // 13. README
    spinner.text = 'Generating README...';
    const readme = generateReadme(answers);
    await fs.writeFile(path.join(targetDir, 'README.md'), readme);

    spinner.succeed(chalk.green('Project created successfully!'));

    // Success message
    console.log('\n' + chalk.bold('  Next steps:\n'));
    console.log(chalk.cyan(`  cd ${answers.projectName}`));
    console.log(chalk.cyan('  npm install'));
    if (answers.database === 'postgresql' || answers.database === 'mysql') {
      console.log(chalk.cyan('  npx prisma migrate dev'));
    }
    console.log(chalk.cyan('  cp .env.example .env  # fill in your values'));
    console.log(chalk.cyan('  npm run dev\n'));
    console.log(chalk.dim('  Happy building! — create-xpressforge by Hammad Sadi\n'));

  } catch (err) {
    spinner.fail(chalk.red('Failed to create project'));
    await fs.remove(targetDir).catch(() => {});
    throw err;
  }
}

function gitignoreContent() {
  return `node_modules/
.env
dist/
build/
*.log
.DS_Store
coverage/
.nyc_output/
`;
}

function serverContent(answers) {
  const ext = answers.language === 'ts' ? 'ts' : 'js';
  return `import 'dotenv/config';
import app from './src/app.js';

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.listen(PORT, () => {
  console.log(\`✅ Server running on http://localhost:\${PORT}\`);
  console.log(\`📦 Environment: \${NODE_ENV}\`);
});
`;
}

function swaggerConfigContent(answers) {
  return `import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '${answers.projectName} API',
      version: '1.0.0',
      description: 'API documentation for ${answers.projectName}',
    },
    servers: [
      { url: \`http://localhost:\${process.env.PORT || 3000}/api/v1\`, description: 'Development' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
`;
}

function envConfigContent(answers) {
  return `export const env = {
  PORT:     process.env.PORT     || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
${answers.database === 'mongodb'                                         ? `  MONGO_URI:              process.env.MONGO_URI,\n`                       : ''}${answers.database === 'postgresql' || answers.database === 'mysql'    ? `  DATABASE_URL:           process.env.DATABASE_URL,\n`                    : ''}${answers.auth === 'jwt'                                                 ? `  JWT_SECRET:             process.env.JWT_SECRET,\n  JWT_EXPIRES_IN:         process.env.JWT_EXPIRES_IN         || '7d',\n  JWT_REFRESH_SECRET:     process.env.JWT_REFRESH_SECRET,\n  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',\n` : ''}};
`;
}

function apiResponseContent() {
  return `/**
 * Consistent API response helper
 */
export const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (res, message = 'Something went wrong', statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
};

export const sendPaginated = (res, data, pagination) => {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      total: pagination.total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
  });
};
`;
}

function loggerContent() {
  return `import { env } from '../config/env.js';

const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const colors = { error: '\\x1b[31m', warn: '\\x1b[33m', info: '\\x1b[36m', debug: '\\x1b[35m', reset: '\\x1b[0m' };

const log = (level, message, meta = {}) => {
  if (env.NODE_ENV === 'test') return;
  const timestamp = new Date().toISOString();
  const color = colors[level] || '';
  const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
  console.log(\`\${color}[\${timestamp}] [\${level.toUpperCase()}] \${message}\${metaStr}\${colors.reset}\`);
};

export const logger = {
  error: (msg, meta) => log('error', msg, meta),
  warn:  (msg, meta) => log('warn',  msg, meta),
  info:  (msg, meta) => log('info',  msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),
};
`;
}

function errorHandlerContent() {
  return `import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = \`\${field} already exists\`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = Object.values(err.errors).map(e => e.message).join(', ');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') { statusCode = 401; message = 'Invalid token'; }
  if (err.name === 'TokenExpiredError')  { statusCode = 401; message = 'Token expired'; }

  logger.error(message, { statusCode, path: req.path, method: req.method });

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
`;
}

function notFoundContent() {
  return `export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: \`Route \${req.method} \${req.originalUrl} not found\`,
  });
};
`;
}

function tsConfig() {
  return {
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'node',
      outDir: './dist',
      rootDir: './',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
      declaration: true,
      declarationMap: true,
      sourceMap: true,
    },
    include: ['src/**/*', 'server.ts'],
    exclude: ['node_modules', 'dist'],
  };
}
