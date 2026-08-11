const express = require("express");
const router = express.Router();
const emailService = require("../utils/emailService");
const { protect, restrictTo } = require("../controllers/authController");

// Test endpoint to send a test email (admin route)
router.post("/test-email", protect, restrictTo("admin"), async (req, res) => {
  try {
    const { type = "welcome", email } = req.body;

    // Mock user object for testing
    const testUser = {
      username: req.user.username || "Test User",
      email: email || req.user.email,
      _id: req.user._id,
    };

    let result;

    switch (type) {
      case "welcome":
        result = await emailService.sendWelcomeEmail(testUser);
        break;

      default:
        return res.status(400).json({
          status: "fail",
          message: "Invalid email type. Use: welcome",
        });
    }

    res.status(200).json({
      status: "success",
      message: `Test ${type} email sent successfully`,
      data: {
        messageId: result.messageId,
        to: testUser.email,
      },
    });
  } catch (error) {
    console.error("❌ Failed to send test email:", error.message);

    res.status(500).json({
      status: "fail",
      message: "Failed to send test email",
    });
  }
});

// Test endpoint to check email service connection (admin route)
router.get(
  "/test-connection",
  protect,
  restrictTo("admin"),
  async (req, res) => {
    try {
      const isConnected = await emailService.testConnection();

      res.status(200).json({
        status: "success",
        message: isConnected
          ? "Email service is connected"
          : "Email service connection failed",
        connected: isConnected,
      });
    } catch (error) {
      console.error("❌ Error testing email connection:", error.message);

      res.status(500).json({
        status: "fail",
        message: "Error testing email connection",
      });
    }
  },
);

module.exports = router;
