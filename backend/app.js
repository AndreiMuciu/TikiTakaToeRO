const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const teamRouter = require("./routes/teamRoutes");
const playerRouter = require("./routes/playerRoutes");
const userRouter = require("./routes/userRoutes");

app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(cookieParser());

app.use(express.json());
app.use("/api/v1/teams", teamRouter);
app.use("/api/v1/players", playerRouter);
app.use("/api/v1/users", userRouter);

module.exports = app;
