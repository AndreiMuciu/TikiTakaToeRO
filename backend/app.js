const express = require("express");
const teamRouter = require("./routes/teamRoutes");
const playerRouter = require("./routes/playerRoutes");

app = express();

app.use(express.json());
app.use("/api/v1/teams", teamRouter);
app.use("/api/v1/players", playerRouter);

module.exports = app;
