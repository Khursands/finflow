const isProd = process.env.NODE_ENV === 'production';

module.exports = (err, req, res, next) => {
  // Always log internally, never expose stack to client
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} →`, err.message);
  if (!isProd) console.error(err.stack);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  if (err.code === 11000) {
    // Don't expose which field caused the duplicate
    return res.status(400).json({ message: 'That value is already in use' });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid identifier format' });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }

  // In production, never reveal the actual error message for 500s
  const status = err.status || 500;
  const message =
    status < 500
      ? err.message
      : isProd
      ? 'An unexpected error occurred'
      : err.message;

  res.status(status).json({ message });
};
