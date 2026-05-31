export function generateDbConfig(answers) {
  const { database } = answers;

  if (database === 'mongodb') {
    return `import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

const MAX_RETRIES = 5;
let retries = 0;

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    logger.info(\`MongoDB connected: \${conn.connection.host}\`);
    retries = 0;
  } catch (err) {
    retries++;
    logger.error(\`MongoDB connection failed (attempt \${retries}/\${MAX_RETRIES}): \${err.message}\`);
    if (retries < MAX_RETRIES) {
      logger.info(\`Retrying in 5 seconds...\`);
      setTimeout(connectDB, 5000);
    } else {
      logger.error('Max retries reached. Exiting...');
      process.exit(1);
    }
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Attempting reconnect...');
  connectDB();
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed due to app termination');
  process.exit(0);
});
`;
  }

  if (database === 'postgresql' || database === 'mysql') {
    return `import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

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

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
`;
  }

  return '';
}
