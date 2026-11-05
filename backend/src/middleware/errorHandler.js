const logger = require('../config/logger');

function errorHandler(err, req, res, next) {
  logger.error({ message: err.message, stack: err.stack });
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports = { errorHandler };
