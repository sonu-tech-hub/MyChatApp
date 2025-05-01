// server/middlewares/csrfMiddleware.js
const csrf = require('csrf');
const tokens = new csrf();

// Generate CSRF token
exports.generateToken = (req, res, next) => {
  // Create a CSRF secret if not already present
  if (!req.session.csrfSecret) {
    req.session.csrfSecret = tokens.secretSync();
  }
  
  // Generate token from secret
  const token = tokens.create(req.session.csrfSecret);
  
  // Make token available to templates
  res.locals.csrfToken = token;
  
  // Set CSRF token in cookie for JavaScript access
  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
  });
  
  next();
};

// Validate CSRF token
exports.validateToken = (req, res, next) => {
  // Skip CSRF check for specific routes
  const ignoreMethods = ['GET', 'HEAD', 'OPTIONS'];
  const ignoreRoutes = ['/api/webhook', '/api/auth/refresh-token'];
  
  if (
    ignoreMethods.includes(req.method) || 
    ignoreRoutes.some(route => req.path.startsWith(route))
  ) {
    return next();
  }
  
  // Get token from header or request body
  const token = req.headers['x-csrf-token'] || 
                req.headers['x-xsrf-token'] || 
                req.body._csrf;
  
  // Verify token
  if (!token || !req.session.csrfSecret || !tokens.verify(req.session.csrfSecret, token)) {
    return res.status(403).json({ message: 'Invalid CSRF token' });
  }
  
  next();
};