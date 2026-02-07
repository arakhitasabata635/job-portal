import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5, // Limit each IP to 5 login attempts
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // it gave the value with out x-
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json({
      success: false,
      message: "Too many login attempts. Please try again after 1 houre.",
      retryAfter: res.getHeader("Retry-After"), // Tells them how many seconds to wait
    });
  },
});
