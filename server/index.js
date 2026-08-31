require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { initializeDatabase } = require('./database/init');
const authRoutes = require('./routes/auth');
const visitorRoutes = require('./routes/visitors');
const staffRoutes = require('./routes/staff');
const tenantRoutes = require('./routes/tenants');
const buildingRoutes = require('./routes/buildings');
const paymentRoutes = require('./routes/payments');
const dashboardRoutes = require('./routes/dashboard');
const operationsRoutes = require('./routes/operations');
const vehicleRoutes = require('./routes/vehicles');
const weaponRoutes = require('./routes/weapons');
const exportRoutes = require('./routes/exports');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for Render/Vercel deployment (required for rate limiting)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Rate limiting - general API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Stricter rate limiting for login endpoint - 10 attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 login attempts per windowMs
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  skipSuccessfulRequests: true // only count failed attempts
});

// CORS configuration - locked down to allowed origins only
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  process.env.FRONTEND_URL,
  /\.vercel\.app$/
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (server-to-server, curl, mobile apps)
    if (!origin) return callback(null, true);
    
    // Check if origin is in the allowed list
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) return allowed.test(origin);
      return allowed === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// IP capture middleware
app.use((req, res, next) => {
  req.clientIP = req.headers['x-forwarded-for'] || 
                 req.connection.remoteAddress || 
                 req.socket.remoteAddress ||
                 req.ip;
  next();
});

// Health check endpoint for monitoring
app.get('/api/health', async (req, res) => {
  try {
    const { runQuery } = require('./database/init');
    await runQuery("SELECT 1 as test", []);
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Health check error:', err);
    res.status(503).json({ 
      status: 'error', 
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes
app.use('/api/auth', loginLimiter, authRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/buildings', buildingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/operations', operationsRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/weapons', weaponRoutes);
app.use('/api/exports', exportRoutes);

// Serve static files in production (only if client/build exists)
// For API-only deployment (Render), this is skipped
const clientBuildPath = path.join(__dirname, '../client/build');
const fs = require('fs');
if (process.env.NODE_ENV === 'production' && fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  // API-only mode - return JSON for root
  app.get('/', (req, res) => {
    res.json({
      message: 'Cherubim Security Management API',
      version: '2.0.0',
      status: 'operational'
    });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Initialize database and start server
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Admin Dashboard: http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

module.exports = app;
