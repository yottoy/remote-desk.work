const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../../config/config');

// Create logs directory if it doesn't exist
const logDir = path.join(process.cwd(), config.logging.directory);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create console format with colors
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    return `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
  })
);

// Create the logger
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'remote-job-scraper' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // File transport for error logs
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logDir, 'exceptions.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Create a stream object for Morgan (if needed for an API endpoint)
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = logger; 