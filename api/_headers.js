/**
 * Middleware to add cache-control headers to all API responses
 * This ensures API responses are never cached
 */

module.exports = (req, res, next) => {
  // Never cache API responses
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  if (next) {
    next();
  }
};

