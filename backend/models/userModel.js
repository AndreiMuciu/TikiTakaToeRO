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
      return !this.googleId && this.isNew;
    },
    validate: {
      validator: function (el) {
        // Only validate if password is present
        if (!this.password) return true;
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
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: {
    type: String,
    select: false,
  },
  emailVerificationExpires: {
    type: Date,
    select: false,
  },
  passwordResetToken: {
    type: String,
    select: false,
  },
  passwordResetExpires: {
    type: Date,
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

userSchema.methods.createEmailVerificationToken = function () {
  const verificationToken = require("crypto").randomBytes(32).toString("hex");

  this.emailVerificationToken = require("crypto")
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return verificationToken;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = require("crypto").randomBytes(32).toString("hex");

  this.passwordResetToken = require("crypto")
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

module.exports = mongoose.model("User", userSchema);
