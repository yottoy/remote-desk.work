require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const database = require('./utils/database');

// Import route handlers
const contentRoutes = require('./routes/contentRoutes');
const jobAlertRoutes = require('./routes/jobAlertRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const authRoutes = require('./routes/authRoutes');

// Import middleware
const authMiddleware = require('./middleware/authMiddleware');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      database: database.isConnected,
      server: 'running'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/content', authMiddleware.optionalAuth, contentRoutes);
app.use('/api/job-alerts', jobAlertRoutes);
app.use('/api/analytics', authMiddleware.requireAuth, analyticsRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: 'The requested resource was not found',
    path: req.originalUrl
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Connect to database
    const connected = await database.connect();
    if (connected) {
      logger.info('Database connected successfully');
    } else {
      logger.warn('Database connection failed, using in-memory storage');
    }

    // Start server
    app.listen(PORT, () => {
      logger.info(`Content Management Server running on port ${PORT}`);
      logger.info(`Health check available at http://localhost:${PORT}/health`);
      logger.info(`API endpoints available at http://localhost:${PORT}/api/`);
    });

    // Initialize background services
    const jobAlertService = require('./services/jobAlertService');
    const analyticsService = require('./services/analyticsService');
    
    await jobAlertService.initialize();
    await analyticsService.initialize();
    
    logger.info('Background services initialized');
    
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

// Graceful shutdown
function gracefulShutdown() {
  logger.info('Received shutdown signal, closing server...');
  
  database.disconnect()
    .then(() => {
      logger.info('Database disconnected');
      process.exit(0);
    })
    .catch((err) => {
      logger.error(`Error during shutdown: ${err.message}`);
      process.exit(1);
    });
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app; 