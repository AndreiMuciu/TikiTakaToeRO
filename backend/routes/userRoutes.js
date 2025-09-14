const userController = require("../controllers/userController");
const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.get("/validate-reset-token/:token", authController.validateResetToken);
router.patch("/reset-password/:token", authController.resetPassword);
router.get("/logout", authController.protect, authController.logout);
router.patch("/deleteMe", authController.protect, userController.deleteMe);
router.get("/me", authController.protect, userController.getMe);
router.patch("/updateMe", authController.protect, userController.updateMe);
router.patch(
  "/updateMyPassword",
  authController.protect,
  authController.updatePassword
);
router.post(
  "/send-verification-email",
  authController.protect,
  authController.sendVerificationEmail
);
router.get("/verify-email/:token", authController.verifyEmail);

router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUser);
router.patch("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);

module.exports = router;
