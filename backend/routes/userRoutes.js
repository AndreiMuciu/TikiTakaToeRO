const userController = require("../controllers/userController");
const express = require("express");
const authController = require("../controllers/authController");
const {
  signupLimiter,
  loginLimiter,
  forgotPasswordLimiter,
} = require("../utils/rateLimiters");

const router = express.Router();

router.post("/signup", signupLimiter, authController.signup);
router.post("/login", loginLimiter, authController.login);
router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  authController.forgotPassword,
);
router.get("/validate-reset-token/:token", authController.validateResetToken);
router.patch("/reset-password/:token", authController.resetPassword);
router.post(
  "/logout",
  authController.protect,
  authController.verifyCsrf,
  authController.logout,
);
router.patch(
  "/deleteMe",
  authController.protect,
  authController.verifyCsrf,
  userController.deleteMe,
);
router.get("/me", authController.protect, userController.getMe);
router.patch(
  "/updateMe",
  authController.protect,
  authController.verifyCsrf,
  userController.updateMe,
);
router.patch(
  "/updateMyPassword",
  authController.protect,
  authController.verifyCsrf,
  authController.updatePassword,
);
router.post(
  "/send-verification-email",
  authController.protect,
  authController.verifyCsrf,
  authController.sendVerificationEmail,
);
router.get("/verify-email/:token", authController.verifyEmail);

router.use(authController.protect);
router.use(authController.restrictTo("admin"));

router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUser);
router.patch("/:id", authController.verifyCsrf, userController.updateUser);
router.delete("/:id", authController.verifyCsrf, userController.deleteUser);

module.exports = router;
