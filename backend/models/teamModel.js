const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "A team must have a name"],
  },
  logo: {
    type: String,
    required: [true, "A team must have a logo"],
  },
});

module.exports = mongoose.model("Team", teamSchema);
