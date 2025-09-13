const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const crypto = require("crypto");
const emailService = require("../utils/emailService");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.OAUTH_CLIENT_ID_GOOGLE,
      clientSecret: process.env.OAUTH_CLIENT_SECRET_GOOGLE,
      callbackURL: "/api/v1/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      // Caută sau creează userul în baza ta de date
      const user = await findOrCreateUser(profile);
      done(null, user); // va fi disponibil în req.user
    }
  )
);

const findOrCreateUser = async (profile) => {
  const email = profile.emails?.[0]?.value;

  if (!email) {
    throw new Error("Google profile does not contain email");
  }

  // Caută userul după email
  let user = await User.findOne({ email });

  if (user) {
    // Dacă nu are googleId, îl adaugăm
    if (!user.googleId) {
      user.googleId = profile.id;
      await user.save();
    }
    return user;
  }

  // Creează user nou, cu password random
  const randomPassword = crypto.randomBytes(32).toString("hex");

  user = await User.create({
    googleId: profile.id,
    username: profile.displayName || email.split("@")[0],
    email,
    password: randomPassword,
    passwordConfirm: randomPassword,
  });

  // Send welcome email for new OAuth users
  try {
    await emailService.sendWelcomeEmail(user);
    console.log(`✅ Welcome email sent to new OAuth user: ${user.email}`);
  } catch (emailError) {
    console.error(
      `❌ Failed to send welcome email to ${user.email}:`,
      emailError.message
    );
    // Don't throw error - user creation should succeed even if email fails
  }

  return user;
};

exports.googleCallbackAuthMiddleware = passport.authenticate("google", {
  session: false,
  failureRedirect: "/login",
});

exports.googleAuthMiddleware = passport.authenticate("google", {
  scope: ["profile", "email"],
});

exports.googleCallbackAuth = (req, res) => {
  const token = signToken(req.user._id);

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000,
  });

  // Redirecționezi către frontend
  res.redirect(`${process.env.FRONTEND_HOME_URL}`);
};

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signToken = signToken;

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  res.cookie("jwt", token, {
    expires: new Date(
      Date.now() +
        Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
  });

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = async (req, res, next) => {
  try {
    const newUser = await User.create({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    });

    // Send welcome email to new user
    try {
      await emailService.sendWelcomeEmail(newUser);
      console.log(`✅ Welcome email sent to new user: ${newUser.email}`);
    } catch (emailError) {
      console.error(
        `❌ Failed to send welcome email to ${newUser.email}:`,
        emailError.message
      );
      // Don't throw error - user creation should succeed even if email fails
    }

    createSendToken(newUser, 201, req, res);
  } catch (err) {
    if (err.name === "ValidationError") {
      const errors = {};

      // Extragem mesajele pe câmpuri
      Object.keys(err.errors).forEach((key) => {
        errors[key] = err.errors[key].message;
      });

      return res.status(400).json({ status: "fail", errors });
    }

    // Eroare de unicitate (duplicate key)
    if (err.cause.code === 11000) {
      const errors = {};
      const field = Object.keys(err.cause.keyPattern)[0];
      errors[field] = `${field} already exists`;
      return res.status(400).json({ status: "fail", errors });
    }

    res.status(400).json({
      status: "fail",
      errors: {
        general: err.message || "Something went wrong",
      },
    });
  }
};
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide email and password!",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: "fail",
        message: "Incorrect email or password",
      });
    }

    createSendToken(user, 200, req, res);
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
};

exports.protect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "You are not logged in! Please log in to get access.",
      });
    }

    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      return res.status(401).json({
        status: "fail",
        message: "The user belonging to this token does no longer exist.",
      });
    }

    req.user = currentUser;
    next();
  } catch (err) {
    res.status(401).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("+password");

    if (
      !(await user.correctPassword(req.body.passwordCurrent, user.password))
    ) {
      return res.status(401).json({
        status: "fail",
        message: "Your current password is wrong.",
      });
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    createSendToken(user, 200, req, res);
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};
