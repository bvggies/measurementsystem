/**
 * CORS / OPTIONS helper for API routes.
 * Call at the start of each handler so preflight OPTIONS requests return 200 instead of 405.
 */

function handleCors(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.status(200).end();
    return true;
  }
  return false;
}

module.exports = { handleCors };
