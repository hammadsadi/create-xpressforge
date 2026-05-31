import { describe, it, expect } from 'vitest';
import { generateDbConfig } from '../src/generators/dbGenerator.js';

describe('generateDbConfig', () => {
  it('returns empty string for no database', () => {
    const result = generateDbConfig({ database: 'none' });
    expect(result).toBe('');
  });

  it('generates mongoose connection for mongodb', () => {
    const result = generateDbConfig({ database: 'mongodb' });
    expect(result).toContain("import mongoose from 'mongoose'");
    expect(result).toContain('mongoose.connect(');
    expect(result).toContain('export const connectDB');
  });

  it('includes retry logic for mongodb', () => {
    const result = generateDbConfig({ database: 'mongodb' });
    expect(result).toContain('MAX_RETRIES');
    expect(result).toContain('setTimeout(connectDB');
  });

  it('handles disconnection event for mongodb', () => {
    const result = generateDbConfig({ database: 'mongodb' });
    expect(result).toContain("mongoose.connection.on('disconnected'");
  });

  it('generates prisma connection for postgresql', () => {
    const result = generateDbConfig({ database: 'postgresql' });
    expect(result).toContain("import { PrismaClient } from '@prisma/client'");
    expect(result).toContain('export const prisma');
    expect(result).toContain('export const connectDB');
  });

  it('generates prisma connection for mysql', () => {
    const result = generateDbConfig({ database: 'mysql' });
    expect(result).toContain("import { PrismaClient } from '@prisma/client'");
    expect(result).toContain('prisma.$connect()');
  });

  it('prisma disconnects on beforeExit', () => {
    const result = generateDbConfig({ database: 'postgresql' });
    expect(result).toContain("process.on('beforeExit'");
    expect(result).toContain('prisma.$disconnect()');
  });
});
