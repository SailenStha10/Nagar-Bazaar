const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('./models');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map((o) => o.trim());
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, mobile apps, server-to-server) and any origin
    // outside production so local development against different hosts/ports keeps working.
    if (!origin || process.env.NODE_ENV !== 'production' || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
};

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '200kb' }));
app.use(mongoSanitize());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Nagar Bazaar API is running' });
});

if (process.env.NODE_ENV !== 'test') {
  app.use(
    '/api',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, message: 'Too many requests, please try again later.' },
    })
  );

  app.use(
    '/api/auth',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 20,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, message: 'Too many attempts, please try again later.' },
    })
  );
}

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/uploads', require('./routes/uploadRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/seed', require('./routes/seedRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/sellers', require('./routes/sellerRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/officers', require('./routes/officerRoutes'));
app.use('/api/verification', require('./routes/verificationRoutes'));
app.use('/api/notices', require('./routes/noticeRoutes'));
app.use('/api/market-monitoring', require('./routes/marketMonitoringRoutes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server error',
  });
});

module.exports = app;
