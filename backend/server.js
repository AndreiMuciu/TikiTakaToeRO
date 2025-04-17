const mongoose = require("mongoose");
const dotenv = require("dotenv");
const app = require("./app");

dotenv.config({ path: "./config.env" });

const DB = process.env.MONGO_URI.replace(
  "<db_password>",
  process.env.DB_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true, // Adaugă această opțiune pentru o mai bună gestionare a conexiunii
  })
  .then(() => console.log("DB connected successfully"))
  .catch((err) => console.error("DB connection error:", err));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
