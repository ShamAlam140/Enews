const rateLimit = require('express-rate-limit');

function createLimiter(windowMs, max) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
  });
}

const generalLimiter = createLimiter(
  Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  Number(process.env.RATE_LIMIT_MAX_REQUESTS || 100)
);

const authLimiter = createLimiter(
  Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  Number(process.env.AUTH_RATE_LIMIT_MAX || 5)
);

module.exports = { generalLimiter, authLimiter };


