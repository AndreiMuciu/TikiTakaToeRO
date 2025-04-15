const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "An user must have a name"],
  },
  teams: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Team",
      required: [true, "An user must have a team"],
    },
  ],
  dateOfBirth: {
    type: Date,
    required: [true, "An user must have a date of birth"],
  },
});

module.exports = mongoose.model("Player", playerSchema);
