import { describe, it, expect } from 'vitest';
import { generateEnv } from '../src/generators/envGenerator.js';

describe('generateEnv', () => {
  it('always includes PORT and NODE_ENV', () => {
    const env = generateEnv({ database: 'none', auth: 'none', extras: [], projectName: 'test' });
    expect(env).toContain('PORT=3000');
    expect(env).toContain('NODE_ENV=development');
  });

  it('includes MONGO_URI for mongodb', () => {
    const env = generateEnv({ database: 'mongodb', auth: 'none', extras: [], projectName: 'test' });
    expect(env).toContain('MONGO_URI=');
  });

  it('includes DATABASE_URL for postgresql', () => {
    const env = generateEnv({ database: 'postgresql', auth: 'none', extras: [], projectName: 'myapp' });
    expect(env).toContain('DATABASE_URL=');
    expect(env).toContain('myapp');
  });

  it('includes DATABASE_URL for mysql', () => {
    const env = generateEnv({ database: 'mysql', auth: 'none', extras: [], projectName: 'myapp' });
    expect(env).toContain('DATABASE_URL=');
  });

  it('does not include db vars when database is none', () => {
    const env = generateEnv({ database: 'none', auth: 'none', extras: [], projectName: 'test' });
    expect(env).not.toContain('MONGO_URI');
    expect(env).not.toContain('DATABASE_URL');
  });

  it('includes JWT vars when auth is jwt', () => {
    const env = generateEnv({ database: 'none', auth: 'jwt', extras: [], projectName: 'test' });
    expect(env).toContain('JWT_SECRET=');
    expect(env).toContain('JWT_EXPIRES_IN=');
    expect(env).toContain('JWT_REFRESH_SECRET=');
    expect(env).toContain('JWT_REFRESH_EXPIRES_IN=');
  });

  it('includes SESSION_SECRET when auth is session', () => {
    const env = generateEnv({ database: 'none', auth: 'session', extras: [], projectName: 'test' });
    expect(env).toContain('SESSION_SECRET=');
  });

  it('does not include auth vars when auth is none', () => {
    const env = generateEnv({ database: 'none', auth: 'none', extras: [], projectName: 'test' });
    expect(env).not.toContain('JWT_SECRET');
    expect(env).not.toContain('SESSION_SECRET');
  });

  it('includes upload vars when multer is selected', () => {
    const env = generateEnv({ database: 'none', auth: 'none', extras: ['multer'], projectName: 'test' });
    expect(env).toContain('MAX_FILE_SIZE=');
    expect(env).toContain('UPLOAD_DIR=');
  });

  it('ends with newline', () => {
    const env = generateEnv({ database: 'none', auth: 'none', extras: [], projectName: 'test' });
    expect(env.endsWith('\n')).toBe(true);
  });
});
