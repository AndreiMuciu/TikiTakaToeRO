const userController = require("../controllers/userController");
const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/logout", authController.protect, authController.logout);
router.patch("/deleteMe", authController.protect, userController.deleteMe);
router.get("/me", authController.protect, userController.getMe);
router.patch("/updateMe", authController.protect, userController.updateMe);
router.patch(
  "/updateMyPassword",
  authController.protect,
  authController.updatePassword
);

router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUser);
router.patch("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);

module.exports = router;
