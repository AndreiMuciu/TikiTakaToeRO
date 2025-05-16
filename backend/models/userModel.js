const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    unique: true,
    sparse: true, // permite câmpuri goale
  },
  email: {
    type: String,
    required: [true, "An user must have an email"],
    unique: [true, "Email already exists"],
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  password: {
    type: String,
    required: function () {
      return !this.googleId;
    },
    minlength: [8, "Password must be at least 8 characters"],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: function () {
      return !this.googleId;
    },
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords are not the same!",
    },
  },
  username: {
    type: String,
    required: [true, "An user must have a username"],
    unique: [true, "username already exists"],
  },
  numberOfMatches: {
    type: Number,
    default: 0,
  },
  numberOfWins: {
    type: Number,
    default: 0,
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// To don't show users deleted in the database
userSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

module.exports = mongoose.model("User", userSchema);
