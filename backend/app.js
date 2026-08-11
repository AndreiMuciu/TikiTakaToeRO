const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const teamRouter = require("./routes/teamRoutes");
const playerRouter = require("./routes/playerRoutes");
const userRouter = require("./routes/userRoutes");
const oAuthRouter = require("./routes/oAuthRoutes");
const emailRouter = require("./routes/emailRoutes");
const passport = require("passport");
const { isAllowedOrigin } = require("./utils/corsConfig");

app = express();

// Required when running behind nginx/load balancers so IP-based middleware works correctly.
const trustProxySetting = (() => {
  const value = process.env.TRUST_PROXY;

  if (value === undefined || value === null || value === "") return 1;
  if (value === "true") return true;
  if (value === "false") return false;

  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? value : numericValue;
})();

app.set("trust proxy", trustProxySetting);

app.disable("x-powered-by");

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'none'"],
        "base-uri": ["'none'"],
        "frame-ancestors": ["'none'"],
        "form-action": ["'self'"],
      },
    },
  }),
);

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(passport.initialize());

app.use(express.json());
app.use("/api/v1/teams", teamRouter);
app.use("/api/v1/players", playerRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/auth", oAuthRouter);
app.use("/api/v1/email", emailRouter);

module.exports = app;
