export function generateAppJs(answers) {
  const { extras, database, auth, structure } = answers;

  const imports = [
    `import express from 'express';`,
    extras.includes('cors')      ? `import cors from 'cors';`                    : '',
    extras.includes('helmet')    ? `import helmet from 'helmet';`                : '',
    extras.includes('morgan')    ? `import morgan from 'morgan';`                : '',
    extras.includes('rateLimit') ? `import rateLimit from 'express-rate-limit';` : '',
    extras.includes('swagger')   ? `import swaggerUi from 'swagger-ui-express';\nimport { swaggerSpec } from './config/swagger.js';` : '',
    database !== 'none'          ? `import { connectDB } from './config/db.js';` : '',
    `import { errorHandler } from './middlewares/errorHandler.js';`,
    `import { notFound } from './middlewares/notFound.js';`,
    `import routes from './routes/index.js';`,
  ].filter(Boolean).join('\n');

  const dbInit = database !== 'none' ? `\n// Connect to database\nconnectDB();\n` : '';

  const rateLimitMiddleware = extras.includes('rateLimit') ? `
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);
` : '';

  const middlewares = [
    extras.includes('helmet')  ? `app.use(helmet());`                   : '',
    extras.includes('cors')    ? `app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));` : '',
    `app.use(express.json({ limit: '10mb' }));`,
    `app.use(express.urlencoded({ extended: true, limit: '10mb' }));`,
    extras.includes('morgan')  ? `app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));` : '',
  ].filter(Boolean).join('\n');

  const swaggerSetup = extras.includes('swagger') ? `\n// API Documentation\napp.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));\n` : '';

  const healthCheck = `
// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is healthy', timestamp: new Date().toISOString() });
});
`;

  return `${imports}
${dbInit}
const app = express();
${rateLimitMiddleware}
// Middlewares
${middlewares}
${swaggerSetup}${healthCheck}
// Routes
app.use('/api/v1', routes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

export default app;
`;
}
