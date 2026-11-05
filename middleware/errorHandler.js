/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Application Error:', err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    message: message
  });
};

/**
 * 404 Not Found middleware for undefined routes
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
