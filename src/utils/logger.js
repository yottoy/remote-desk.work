/**
 * A simplified logger for testing
 */
const logger = {
  error: (message) => console.error(`[ERROR] ${message}`),
  warn: (message) => console.warn(`[WARN] ${message}`),
  info: (message) => console.info(`[INFO] ${message}`),
  debug: (message) => console.debug(`[DEBUG] ${message}`)
};

module.exports = logger; 