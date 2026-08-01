const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const mongoose = require("mongoose");
const app = require("./app");
const http = require("http");
const initializeSocketServer = require("./socketServer"); // <- import nou
const emailService = require("./utils/emailService");

const DB = process.env.MONGO_URI.replace(
  "<db_password>",
  process.env.DB_PASSWORD,
);

mongoose
  .connect(DB)
  .then(() => console.log("DB connected successfully"))
  .catch((err) => console.error("DB connection error:", err));

// Test email service connection
emailService.testConnection();

const port = process.env.PORT || 3000;

const server = http.createServer(app);

async function startServer() {
  await initializeSocketServer(server);

  server.listen(port, () => {
    console.log(`App running on port ${port}...`);
  });
}

startServer().catch((error) => {
  console.error("Server startup failed:", error);
  process.exit(1);
});
