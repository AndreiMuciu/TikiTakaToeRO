const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "An user must have an email"],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "An user must have a password"],
  },
  username: {
    type: String,
    required: [true, "An user must have a username"],
  },
});

module.exports = mongoose.model("User", userSchema);
