const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const teamRouter = require("./routes/teamRoutes");
const playerRouter = require("./routes/playerRoutes");
const userRouter = require("./routes/userRoutes");
const oAuthRouter = require("./routes/oAuthRoutes");
const emailRouter = require("./routes/emailRoutes");
const passport = require("passport");

app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
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
