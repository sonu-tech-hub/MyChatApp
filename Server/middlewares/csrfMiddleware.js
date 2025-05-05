const csrf = require('csrf');
const tokens = new csrf();

// Generate CSRF token
exports.generateToken = (req, res, next) => {
  // Create a CSRF secret if not already present
  if (!req.session.csrfSecret) {
    req.session.csrfSecret = tokens.secretSync();
  }

  // Generate CSRF token from secret
  const token = tokens.create(req.session.csrfSecret);

  // Make token available to templates (for server-side rendered pages)
  res.locals.csrfToken = token;

  // Set CSRF token in cookie for JavaScript access
  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false, // Allow JS access to this cookie
    sameSite: 'strict', // Restrict cross-origin requests
    secure: process.env.NODE_ENV === 'production', // Only send cookie over HTTPS in production
    maxAge: 3600000, // Optional: Set expiration time for the cookie (1 hour)
  });

  next();
};

// Validate CSRF token
exports.validateToken = (req, res, next) => {
  // Skip CSRF check for specific routes and HTTP methods
  const ignoreMethods = ['GET', 'HEAD', 'OPTIONS'];
  const ignoreRoutes = ['/api/webhook', '/api/auth/refresh-token'];

  if (
    ignoreMethods.includes(req.method) || 
    ignoreRoutes.some(route => req.path.startsWith(route))
  ) {
    return next(); // Skip CSRF validation for exempted routes and methods
  }

  // Get CSRF token from headers or request body
  const token = req.headers['x-csrf-token'] || 
                req.headers['x-xsrf-token'] || 
                req.body._csrf;

  // Verify the CSRF token
  if (!token || !req.session.csrfSecret || !tokens.verify(req.session.csrfSecret, token)) {
    return res.status(403).json({ message: 'Invalid CSRF token' });
  }

  next();
};
