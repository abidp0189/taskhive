const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// Wrap $transaction to apply safe timeouts for cloud databases (Render <-> Aiven MySQL)
const originalTransaction = prisma.$transaction.bind(prisma);
prisma.$transaction = function (arg, options = {}) {
  if (typeof arg === 'function') {
    return originalTransaction(arg, {
      maxWait: 15000, // 15 seconds max wait to acquire a connection
      timeout: 30000, // 30 seconds transaction timeout (default is only 5s)
      ...options,
    });
  }
  return originalTransaction(arg, options);
};

module.exports = prisma;

