import { describe, it, expect } from 'vitest';
import { generateAppJs } from '../src/generators/appGenerator.js';

const base = {
  structure: 'mvc',
  database: 'mongodb',
  auth: 'jwt',
  extras: ['cors', 'helmet', 'morgan', 'rateLimit'],
  language: 'js',
};

describe('generateAppJs', () => {
  it('always includes routes import', () => {
    const output = generateAppJs(base);
    expect(output).toContain("import routes from './routes/index.js'");
  });

  it('includes cors when selected', () => {
    const output = generateAppJs(base);
    expect(output).toContain("import cors from 'cors'");
    expect(output).toContain('app.use(cors(');
  });

  it('does NOT include cors when not selected', () => {
    const output = generateAppJs({ ...base, extras: [] });
    expect(output).not.toContain("import cors from 'cors'");
  });

  it('includes helmet when selected', () => {
    const output = generateAppJs(base);
    expect(output).toContain("import helmet from 'helmet'");
    expect(output).toContain('app.use(helmet())');
  });

  it('includes rate limit when selected', () => {
    const output = generateAppJs(base);
    expect(output).toContain("import rateLimit from 'express-rate-limit'");
    expect(output).toContain('rateLimit(');
  });

  it('includes morgan when selected', () => {
    const output = generateAppJs(base);
    expect(output).toContain("import morgan from 'morgan'");
    expect(output).toContain('app.use(morgan(');
  });

  it('includes DB connectDB when database is not none', () => {
    const output = generateAppJs(base);
    expect(output).toContain("import { connectDB } from './config/db.js'");
    expect(output).toContain('connectDB()');
  });

  it('does NOT include connectDB when database is none', () => {
    const output = generateAppJs({ ...base, database: 'none' });
    expect(output).not.toContain('connectDB');
  });

  it('includes swagger import only when swagger is selected', () => {
    const withSwagger = generateAppJs({ ...base, extras: [...base.extras, 'swagger'] });
    expect(withSwagger).toContain("import swaggerUi from 'swagger-ui-express'");
    expect(withSwagger).toContain("import { swaggerSpec } from './config/swagger.js'");

    const withoutSwagger = generateAppJs(base);
    expect(withoutSwagger).not.toContain('swagger');
  });

  it('includes health check endpoint', () => {
    const output = generateAppJs(base);
    expect(output).toContain("app.get('/health'");
  });

  it('always ends with error handler and notFound', () => {
    const output = generateAppJs(base);
    expect(output).toContain('app.use(notFound)');
    expect(output).toContain('app.use(errorHandler)');
  });

  it('exports app as default', () => {
    const output = generateAppJs(base);
    expect(output).toContain('export default app');
  });
});
