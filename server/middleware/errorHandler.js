/**
 * Centralized API Error Handling Middleware
 */
export function errorHandler(err, req, res, next) {
  console.error('[API Error]', err.stack || err.message);

  const statusCode = err.status || err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: err.message || 'An unexpected server error occurred.',
      details: process.env.NODE_ENV === 'development' ? err.details || err.stack : undefined,
    },
  });
}
