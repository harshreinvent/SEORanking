// Simple shared secret key authentication middleware
export const authenticateSecret = (req, res, next) => {
  const secretKey = process.env.SHARED_SECRET_KEY;
  
  if (!secretKey) {
    console.error('SHARED_SECRET_KEY not configured in environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Check for secret key in header
  const providedSecret = req.headers['x-api-secret'] || req.headers['x-secret-key'];

  if (!providedSecret) {
    return res.status(401).json({ error: 'Secret key required. Include it in header: X-API-Secret or X-Secret-Key' });
  }

  if (providedSecret !== secretKey) {
    return res.status(401).json({ error: 'Invalid secret key' });
  }

  next();
};

