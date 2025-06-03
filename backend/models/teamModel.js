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
  country: {
    type: String,
    required: [true, "A team must have a country"],
  },
  description: {
    type: String,
    required: [true, "A team must have a description"],
  },
});

module.exports = mongoose.model("Team", teamSchema);
