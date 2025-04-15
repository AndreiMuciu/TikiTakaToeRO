const express = require("express");
const cookieParser = require("cookie-parser");
const teamRouter = require("./routes/teamRoutes");
const playerRouter = require("./routes/playerRoutes");
const userRouter = require("./routes/userRoutes");

app = express();

app.use(cookieParser());

app.use(express.json());
app.use("/api/v1/teams", teamRouter);
app.use("/api/v1/players", playerRouter);
app.use("/api/v1/users", userRouter);

module.exports = app;
