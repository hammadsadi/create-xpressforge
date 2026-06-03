export function generateDbConfig(answers) {
  const { database } = answers;

  if (database === 'mongodb') {
    return `import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

const MAX_RETRIES = 5;
const RETRY_INTERVAL_MS = 5000;

// Track state to prevent multiple simultaneous retry loops
let retries = 0;
let isConnecting = false;
let isShuttingDown = false;

export const connectDB = async () => {
  // Validate env before attempting connection
  if (!process.env.MONGO_URI) {
    logger.error('MONGO_URI is not defined in environment variables');
    logger.error('Please add MONGO_URI to your .env file and restart the server');
    process.exit(1);
  }

  // Prevent multiple simultaneous connection attempts
  if (isConnecting) return;
  isConnecting = true;

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
    });
    retries = 0;
    isConnecting = false;
    logger.info(\\\`MongoDB connected: \\\${conn.connection.host}\\\`);
  } catch (err) {
    isConnecting = false;
    retries++;
    logger.error(\\\`MongoDB connection failed (attempt \\\${retries}/\\\${MAX_RETRIES}): \\\${err.message}\\\`);

    if (retries >= MAX_RETRIES) {
      logger.error('Max retries reached. Could not connect to MongoDB. Exiting...');
      process.exit(1);
    }

    logger.info(\\\`Retrying in \\\${RETRY_INTERVAL_MS / 1000} seconds...\\\`);
    setTimeout(connectDB, RETRY_INTERVAL_MS);
  }
};

// Only reconnect if not already connecting and not shutting down
mongoose.connection.on('disconnected', () => {
  if (isShuttingDown || isConnecting) return;
  logger.warn('MongoDB disconnected. Attempting reconnect...');
  retries = 0;
  connectDB();
});

mongoose.connection.on('error', (err) => {
  logger.error(\\\`MongoDB error: \\\${err.message}\\\`);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  isShuttingDown = true;
  logger.info(\\\`\\\${signal} received — closing MongoDB connection...\\\`);
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
  process.exit(0);
};

process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
`;
  }

  if (database === 'postgresql' || database === 'mysql') {
    return `import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

if (!process.env.DATABASE_URL) {
  logger.error('DATABASE_URL is not defined in environment variables');
  logger.error('Please add DATABASE_URL to your .env file and restart the server');
  process.exit(1);
}

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export const connectDB = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected via Prisma');
  } catch (err) {
    logger.error('Database connection failed: ' + err.message);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(\\\`\\\${signal} received — disconnecting Prisma...\\\`);
  await prisma.$disconnect();
  logger.info('Database disconnected');
  process.exit(0);
};

process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
`;
  }

  return '';
}
