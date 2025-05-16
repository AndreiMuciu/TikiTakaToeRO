const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const mongoose = require("mongoose");
const app = require("./app");
const http = require("http");
const initializeSocketServer = require("./socketServer"); // <- import nou

const DB = process.env.MONGO_URI.replace(
  "<db_password>",
  process.env.DB_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("DB connected successfully"))
  .catch((err) => console.error("DB connection error:", err));

const port = process.env.PORT || 3000;

const server = http.createServer(app);

initializeSocketServer(server);

server.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
