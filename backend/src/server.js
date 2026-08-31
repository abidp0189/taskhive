const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const app = require('./app');
const { cleanupExpiredProofs } = require('./utils/cleanup');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT} [${process.env.NODE_ENV || 'development'}]`);
  
  // Run 30-day automatic proof cleanup on startup
  cleanupExpiredProofs();
  
  // Schedule cleanup to run every 6 hours
  setInterval(cleanupExpiredProofs, 6 * 60 * 60 * 1000);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use by another process!`);
    console.error(`👉 Run 'npx kill-port ${PORT}' or close the process using port ${PORT}.`);
  } else {
    console.error('❌ Server error:', err);
  }
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down server...');
  server.close(() => {
    console.log('💥 Process terminated.');
  });
});
