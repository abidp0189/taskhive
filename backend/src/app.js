const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const jobRoutes = require('./routes/job.routes');
const taskRoutes = require('./routes/task.routes');
const walletRoutes = require('./routes/wallet.routes');
const referralRoutes = require('./routes/referral.routes');
const notificationRoutes = require('./routes/notification.routes');
const uploadRoutes = require('./routes/upload.routes');
const adminRoutes = require('./routes/admin.routes');
const employerRoutes = require('./routes/employer.routes');
const categoryRoutes = require('./routes/category.routes');
const supportRoutes = require('./routes/support.routes');
const { errorHandler } = require('./middleware/error.middleware');

const app = express();

// ─── Security ───────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ─── CORS ────────────────────────────────────────
const isDev = process.env.NODE_ENV !== 'production';

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests or local development origins
    if (!origin || isDev || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    const allowed = [
      process.env.FRONTEND_URL,
      'https://amader-kaj.vercel.app',
      'https://microjob.vercel.app'
    ].filter(Boolean);
    if (allowed.includes(origin) || allowed.some(a => origin.endsWith('.vercel.app'))) {
      return callback(null, true);
    }
    callback(new Error('CORS not allowed for this origin'), false);
  },
  credentials: true,
}));

// ─── Rate limiting (Relaxed for dev) ───────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 500,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 50,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
});

app.use('/api/', apiLimiter);

// ─── Body parsing ────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// ─── Logging ─────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── Static files (uploads) ──────────────────────
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '../uploads')));

// ─── Health check ────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'API is running', timestamp: new Date().toISOString() });
});

// ─── Routes ──────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/referral', referralRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employer', employerRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/support', supportRoutes);

// ─── 404 ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Error handler ───────────────────────────────
app.use(errorHandler);

module.exports = app;
