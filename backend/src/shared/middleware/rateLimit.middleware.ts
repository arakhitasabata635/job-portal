import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Limit each IP to 10 login attempts
  skipSuccessfulRequests: true,
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // it gave the value with out x-
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json({
      success: false,
      message: 'Too many login attempts. Please try again after 15 minute.',
      retryAfter: res.getHeader('Retry-After'), // Tells them how many seconds to wait
    });
  },
});
