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

  it('validates MONGO_URI env before connecting', () => {
    const result = generateDbConfig({ database: 'mongodb' });
    expect(result).toContain('MONGO_URI');
    expect(result).toContain('process.exit(1)');
  });

  it('prevents multiple simultaneous connections with isConnecting flag', () => {
    const result = generateDbConfig({ database: 'mongodb' });
    expect(result).toContain('isConnecting');
  });

  it('includes retry logic for mongodb', () => {
    const result = generateDbConfig({ database: 'mongodb' });
    expect(result).toContain('MAX_RETRIES');
    expect(result).toContain('setTimeout(connectDB');
  });

  it('handles disconnection event without looping', () => {
    const result = generateDbConfig({ database: 'mongodb' });
    expect(result).toContain("mongoose.connection.on('disconnected'");
    expect(result).toContain('isShuttingDown');
  });

  it('handles SIGINT and SIGTERM gracefully', () => {
    const result = generateDbConfig({ database: 'mongodb' });
    expect(result).toContain("process.on('SIGINT'");
    expect(result).toContain("process.on('SIGTERM'");
    expect(result).toContain('gracefulShutdown');
  });

  it('generates prisma connection for postgresql', () => {
    const result = generateDbConfig({ database: 'postgresql' });
    expect(result).toContain("import { PrismaClient } from '@prisma/client'");
    expect(result).toContain('export const prisma');
    expect(result).toContain('export const connectDB');
  });

  it('validates DATABASE_URL for prisma', () => {
    const result = generateDbConfig({ database: 'postgresql' });
    expect(result).toContain('DATABASE_URL');
    expect(result).toContain('process.exit(1)');
  });

  it('generates prisma connection for mysql', () => {
    const result = generateDbConfig({ database: 'mysql' });
    expect(result).toContain("import { PrismaClient } from '@prisma/client'");
    expect(result).toContain('prisma.$connect()');
  });

  it('prisma handles graceful shutdown', () => {
    const result = generateDbConfig({ database: 'postgresql' });
    expect(result).toContain('prisma.$disconnect()');
    expect(result).toContain('gracefulShutdown');
  });
});
