const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

// Optionally use Redis for distributed rate limiting in production
let redisClient;
if (process.env.NODE_ENV === 'production' && process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL);
  } catch (error) {
    console.error('Error connecting to Redis:', error.message);
    redisClient = null; // Fallback to in-memory store if Redis is unavailable
  }
}

// Centralized rate limit configuration for easier maintenance
const createLimiter = (windowMs, max, message) => {
  const config = {
    windowMs,
    max,
    message: { message },
    standardHeaders: true,
    legacyHeaders: false,
  };

  // Use Redis store in production if available
  if (redisClient) {
    config.store = new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
    });
  }

  return rateLimit(config);
};

// General API rate limiter
exports.apiLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests per windowMs
  'Too many requests, please try again later.'
);

// Auth endpoint rate limiter (more strict)
exports.authLimiter = createLimiter(
  60 * 60 * 1000, // 1 hour
  5, // 5 failed attempts per hour
  'Too many login attempts, please try again later.'
);

// OTP request limiter
exports.otpLimiter = createLimiter(
  60 * 60 * 1000, // 1 hour
  3, // 3 OTP requests per hour
  'Too many verification code requests, please try again later.'
);

// Fallback for when Redis is unavailable
exports.fallbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

