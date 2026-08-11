const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    const port = Number(process.env.EMAIL_PORT) || 465;
    const secure =
      process.env.EMAIL_SECURE !== undefined
        ? process.env.EMAIL_SECURE === "true"
        : port === 465;

    // Create transporter for Zoho email
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port,
      secure,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
      // Additional configuration for better delivery
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });

    this.from = `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`;
  }

  // Test email configuration
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log("✅ Email service is ready");
      return true;
    } catch (error) {
      console.error("❌ Email service connection failed:", error.message);
      return false;
    }
  }

  // Send any email
  async sendEmail(options) {
    try {
      const mailOptions = {
        from: this.from,
        to: options.email,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      // Add reply-to if specified
      if (options.replyTo) {
        mailOptions.replyTo = options.replyTo;
      }

      const result = await this.transporter.sendMail(mailOptions);
      console.log(
        `📧 Email sent successfully to ${options.email}:`,
        result.messageId,
      );
      return result;
    } catch (error) {
      console.error(
        `❌ Failed to send email to ${options.email}:`,
        error.message,
      );
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }

  // Send welcome email to new users
  async sendWelcomeEmail(user) {
    const welcomeTemplate =
      require("./emailTemplates").getWelcomeTemplate(user);

    const emailOptions = {
      email: user.email,
      subject: "Welcome to TikiTakaToeRO! ⚽",
      html: welcomeTemplate.html,
      text: welcomeTemplate.text,
    };

    return this.sendEmail(emailOptions);
  }

  // Send email verification email
  async sendEmailVerificationEmail(user, verificationToken) {
    const verificationTemplate =
      require("./emailTemplates").getEmailVerificationTemplate(
        user,
        verificationToken,
      );

    const emailOptions = {
      email: user.email,
      subject: "Confirm your email address - TikiTakaToeRO ✉️",
      html: verificationTemplate.html,
      text: verificationTemplate.text,
    };

    return this.sendEmail(emailOptions);
  }

  // Send password reset email
  async sendPasswordResetEmail(user, resetToken) {
    const resetTemplate = require("./emailTemplates").getPasswordResetTemplate(
      user,
      resetToken,
    );

    const emailOptions = {
      email: user.email,
      subject: "Reset your password - TikiTakaToeRO 🔒",
      html: resetTemplate.html,
      text: resetTemplate.text,
    };

    return this.sendEmail(emailOptions);
  }
}

// Create and export a single instance
const emailService = new EmailService();

module.exports = emailService;
