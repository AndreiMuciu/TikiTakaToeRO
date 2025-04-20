const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "An player must have a name"],
  },
  teams: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Team",
      required: [true, "An player must have a team"],
    },
  ],
  dateOfBirth: {
    type: Date,
    required: [true, "An player must have a date of birth"],
  },
  nationality: {
    type: String,
    required: [true, "An player must have a nationality"],
  },
});

module.exports = mongoose.model("Player", playerSchema);
