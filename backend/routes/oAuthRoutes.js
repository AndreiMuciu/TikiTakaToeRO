const express = require("express");
const passport = require("passport");
const router = express.Router();
const AuthController = require("../controllers/authController");

// Redirect către Google pentru autentificare
router.get("/google", AuthController.googleAuthMiddleware);

// Callback de la Google
router.get(
  "/google/callback",
  AuthController.googleCallbackAuthMiddleware,
  AuthController.googleCallbackAuth
);

module.exports = router;
