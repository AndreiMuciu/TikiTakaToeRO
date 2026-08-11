const rateLimit = require("express-rate-limit");

const createAuthLimiter = (max, message) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      status: "fail",
      message,
    },
  });

exports.signupLimiter = createAuthLimiter(
  10,
  "Too many signup attempts from this IP. Please try again in 15 minutes.",
);

exports.loginLimiter = createAuthLimiter(
  5,
  "Too many login attempts from this IP. Please try again in 15 minutes.",
);

exports.forgotPasswordLimiter = createAuthLimiter(
  5,
  "Too many password reset requests from this IP. Please try again in 15 minutes.",
);
