import { describe, it, expect } from 'vitest';
import { generatePackageJson } from '../src/generators/packageJsonGenerator.js';

const base = {
  projectName: 'test-app',
  database: 'mongodb',
  auth: 'jwt',
  extras: ['cors', 'helmet', 'morgan', 'rateLimit'],
  language: 'js',
};

describe('generatePackageJson', () => {
  it('sets correct project name', () => {
    const pkg = generatePackageJson(base);
    expect(pkg.name).toBe('test-app');
  });

  it('sets type to module', () => {
    const pkg = generatePackageJson(base);
    expect(pkg.type).toBe('module');
  });

  it('includes mongoose for mongodb', () => {
    const pkg = generatePackageJson(base);
    expect(pkg.dependencies).toHaveProperty('mongoose');
  });

  it('includes prisma for postgresql', () => {
    const pkg = generatePackageJson({ ...base, database: 'postgresql' });
    expect(pkg.dependencies).toHaveProperty('@prisma/client');
    expect(pkg.devDependencies).toHaveProperty('prisma');
  });

  it('includes prisma for mysql', () => {
    const pkg = generatePackageJson({ ...base, database: 'mysql' });
    expect(pkg.dependencies).toHaveProperty('@prisma/client');
  });

  it('does not include db deps when database is none', () => {
    const pkg = generatePackageJson({ ...base, database: 'none' });
    expect(pkg.dependencies).not.toHaveProperty('mongoose');
    expect(pkg.dependencies).not.toHaveProperty('@prisma/client');
  });

  it('includes jwt deps when auth is jwt', () => {
    const pkg = generatePackageJson(base);
    expect(pkg.dependencies).toHaveProperty('jsonwebtoken');
    expect(pkg.dependencies).toHaveProperty('bcryptjs');
  });

  it('includes session deps when auth is session', () => {
    const pkg = generatePackageJson({ ...base, auth: 'session' });
    expect(pkg.dependencies).toHaveProperty('express-session');
    expect(pkg.dependencies).toHaveProperty('connect-mongo');
  });

  it('includes cors when selected', () => {
    const pkg = generatePackageJson(base);
    expect(pkg.dependencies).toHaveProperty('cors');
  });

  it('includes helmet when selected', () => {
    const pkg = generatePackageJson(base);
    expect(pkg.dependencies).toHaveProperty('helmet');
  });

  it('does not include multer when not selected', () => {
    const pkg = generatePackageJson(base);
    expect(pkg.dependencies).not.toHaveProperty('multer');
  });

  it('includes multer when selected', () => {
    const pkg = generatePackageJson({ ...base, extras: [...base.extras, 'multer'] });
    expect(pkg.dependencies).toHaveProperty('multer');
  });

  it('includes socket.io when selected', () => {
    const pkg = generatePackageJson({ ...base, extras: [...base.extras, 'socket'] });
    expect(pkg.dependencies).toHaveProperty('socket.io');
  });

  it('always includes dotenv', () => {
    const pkg = generatePackageJson(base);
    expect(pkg.dependencies).toHaveProperty('dotenv');
  });

  it('JS dev script uses nodemon correctly', () => {
    const pkg = generatePackageJson(base);
    expect(pkg.scripts.dev).toBe('nodemon server.js');
    expect(pkg.scripts.start).toBe('node server.js');
  });

  it('TS dev script uses tsx', () => {
    const pkg = generatePackageJson({ ...base, language: 'ts' });
    expect(pkg.scripts.dev).toBe('tsx watch server.ts');
    expect(pkg.scripts.build).toBe('tsc');
  });

  it('TS includes typescript and types', () => {
    const pkg = generatePackageJson({ ...base, language: 'ts' });
    expect(pkg.devDependencies).toHaveProperty('typescript');
    expect(pkg.devDependencies).toHaveProperty('@types/node');
    expect(pkg.devDependencies).toHaveProperty('@types/express');
  });
});
