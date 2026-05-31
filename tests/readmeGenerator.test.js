import { describe, it, expect } from 'vitest';
import { generateReadme } from '../src/generators/readmeGenerator.js';

const base = {
  projectName: 'my-api',
  structure: 'mvc',
  database: 'mongodb',
  auth: 'jwt',
  extras: ['cors', 'helmet'],
  language: 'js',
};

describe('generateReadme', () => {
  it('includes project name as heading', () => {
    const readme = generateReadme(base);
    expect(readme).toContain('# my-api');
  });

  it('mentions create-xpressforge', () => {
    const readme = generateReadme(base);
    expect(readme).toContain('create-xpressforge');
  });

  it('shows correct structure in table', () => {
    const readme = generateReadme(base);
    expect(readme).toContain('MVC');
  });

  it('shows correct database', () => {
    const readme = generateReadme({ ...base, database: 'postgresql' });
    expect(readme).toContain('Postgresql');
  });

  it('includes auth endpoints when jwt', () => {
    const readme = generateReadme(base);
    expect(readme).toContain('/auth/register');
    expect(readme).toContain('/auth/login');
    expect(readme).toContain('/auth/refresh');
    expect(readme).toContain('/auth/me');
  });

  it('excludes auth endpoints when auth is none', () => {
    const readme = generateReadme({ ...base, auth: 'none' });
    expect(readme).not.toContain('/auth/register');
  });

  it('includes user endpoints', () => {
    const readme = generateReadme(base);
    expect(readme).toContain('/api/v1/users');
  });

  it('includes npm scripts section', () => {
    const readme = generateReadme(base);
    expect(readme).toContain('npm run dev');
    expect(readme).toContain('npm start');
  });

  it('includes TypeScript build script for TS projects', () => {
    const readme = generateReadme({ ...base, language: 'ts' });
    expect(readme).toContain('npm run build');
  });

  it('mentions prisma migrate for postgresql', () => {
    const readme = generateReadme({ ...base, database: 'postgresql' });
    expect(readme).toContain('prisma migrate dev');
  });

  it('includes .env.example instruction', () => {
    const readme = generateReadme(base);
    expect(readme).toContain('.env.example');
  });

  it('ends with Hammad Sadi attribution', () => {
    const readme = generateReadme(base);
    expect(readme).toContain('Hammad Sadi');
  });
});
