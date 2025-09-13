// Email templates for TikiTakaToe application

const signature = ` 

<div>
    <span class="font" style="font-family:arial, helvetica, sans-serif">
        <span class="size" style="font-size:14.667px">
            <span class="colour" style="color: rgb(51, 51, 51);">
                Mucioniu Constantin-Andrei
            </span>
        </span>
    </span>
    <span class="colour" style="color: rgb(51, 51, 51);">
    </span>
    <br>
</div>
<div>
    <span class="font" style="font-family:arial, helvetica, sans-serif">
        <span class="colour" style="color: rgb(0, 102, 0);">
            <span class="size" style="font-size: 14.667px;">
                Founder
            </span>
        </span>
    </span>
    <br>
</div>
<div>
    <br>
</div>
<div>
    <span class="font" style="font-family:arial, helvetica, sans-serif">
        <a href="https://tikitakatoe.ro" target="_blank">
            <span class="colour" style="color: rgb(0, 102, 0);">
                www.tikitakatoe.ro
            </span>
        </a>
    </span>
    <br>
</div>
<div>
    <span class="font" style="font-family:arial, helvetica, sans-serif">
        <span class="colour" style="color: rgb(0, 102, 0);">
            <span class="size" style="font-size: 24px; width: 400px; height: 400px;">
                <a href="https://tikitakatoe.ro" target="_blank">
                    <img src="https://raw.githubusercontent.com/AndreiMuciu/TikiTakaToeRO/main/frontend/public/TicTacToe.png" alt="TikiTakaToeRO Logo" width="41" height="41">
                </a>
            </span>
        </span>
        <span class="size" style="font-size:32px">
            <a href="https://tikitakatoe.ro" target="_blank">
                <span class="highlight" style="background-color: rgb(255, 255, 255);">
                    <span class="colour" style="color: rgb(0, 102, 0);">
                        TikiTakaToeRO
                    </span>
                </span>
            </a>
        </span>
    </span>
    <br>
</div>

`;

const getWelcomeTemplate = (user) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to TikiTakaToe</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .email-container {
                background-color: #ffffff;
                border-radius: 10px;
                padding: 30px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 2.5em;
                color: #2c5aa0;
                margin-bottom: 10px;
            }
            .welcome-title {
                color: #2c5aa0;
                font-size: 1.8em;
                margin-bottom: 20px;
            }
            .content {
                margin-bottom: 25px;
            }
            .highlight {
                background-color: #e8f4fd;
                padding: 15px;
                border-left: 4px solid #2c5aa0;
                margin: 20px 0;
            }
            .cta-button {
                display: inline-block;
                background-color: #2c5aa0;
                color: white !important;
                padding: 12px 25px;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
                text-align: center;
            }
            .cta-button:visited {
                color: white !important;
            }
            .cta-button:hover {
                color: white !important;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #666;
                font-size: 0.9em;
            }
            .social-links {
                margin-top: 15px;
            }
            .social-links a {
                margin: 0 10px;
                color: #2c5aa0;
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="logo">⚽ TikiTakaToeRO</div>
                <h1 class="welcome-title">Welcome to the Game, ${user.username}! 🎮</h1>
            </div>
            
            <div class="content">
                <p>Hey ${user.username},</p>
                
                <p>Welcome to <strong>TikiTakaToeRO</strong> - where football meets strategy in the most exciting way possible! We're thrilled to have you join our community of football enthusiasts and strategic thinkers.</p>
                
                <div class="highlight">
                    <h3>🚀 You're all set to:</h3>
                    <ul>
                        <li>Challenge players from around the world</li>
                        <li>Climb the leaderboards and show your tactical skills</li>
                        <li>Connect with fellow football fans</li>
                    </ul>
                </div>
                
                <p style="text-align: center;">
                    <a href="${process.env.FRONTEND_HOME_URL}" class="cta-button" style="display: inline-block; background-color: #2c5aa0; color: white !important; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 20px 0; text-align: center;">Start Playing Now! ⚽</a>
                </p>
                
                <p>Need help getting started? Check out our game guide or reach out to our support team. We're here to help you make the most of your TikiTakaToeRO experience!</p>
                
                <p>Good luck on the pitch!</p>
                
                <p><strong>The TikiTakaToeRO Team</strong></p>
            </div>

            <div class="footer">
                <p>This email was sent because you created an account on TikiTakaToeRO.</p>
                <p>© 2025 TikiTakaToeRO. All rights reserved.</p>
                <div class="social-links">
                    <a href="https://tikitakatoe.ro">Website</a> | 
                    <a href="https://www.instagram.com/tikitakatoe.ro/">Instagram</a> | 
                    <a href="mailto:contact@tikitakatoe.ro">Support</a>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;

  const text = `
Welcome to TikiTakaToeRO, ${user.username}! ⚽

Hey ${user.username},

Welcome to TikiTakaToeRO - where football meets strategy in the most exciting way possible! We're thrilled to have you join our community of football enthusiasts and strategic thinkers.

You're all set to:
• Challenge players from around the world
• Climb the leaderboards and show your tactical skills
• Connect with fellow football fans

Start playing now: ${process.env.FRONTEND_HOME_URL}

Need help getting started? Check out our game guide or reach out to our support team. We're here to help you make the most of your TikiTakaToeRO experience!

Good luck on the pitch!

The TikiTakaToeRO Team

© 2025 TikiTakaToeRO. All rights reserved.
  `;

  return { html, text };
};

const getEmailVerificationTemplate = (user, verificationToken) => {
  const verificationUrl = `${process.env.FRONTEND_HOME_URL}verify-email/${verificationToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirm your email address</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 0;
                background-color: #f8f9fa;
                color: #333;
            }
            .email-container {
                max-width: 600px;
                margin: 20px auto;
                background: white;
                border-radius: 10px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #2c5aa0 0%, #1e3f73 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .logo {
                font-size: 1.5em;
                font-weight: bold;
                margin-bottom: 10px;
            }
            .verify-title {
                margin: 0;
                font-size: 1.8em;
                font-weight: 300;
                margin-bottom: 20px;
            }
            .content {
                padding: 30px;
                margin-bottom: 25px;
            }
            .highlight {
                background-color: #e8f4fd;
                padding: 15px;
                border-left: 4px solid #2c5aa0;
                margin: 20px 0;
                border-radius: 0 5px 5px 0;
            }
            .cta-button {
                display: inline-block;
                background-color: #2c5aa0;
                color: white !important;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 5px;
                margin: 25px 0;
                text-align: center;
                font-weight: bold;
                font-size: 1.1em;
            }
            .cta-button:visited {
                color: white !important;
            }
            .cta-button:hover {
                background-color: #1e3f73;
                color: white !important;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding: 20px 30px;
                border-top: 1px solid #eee;
                color: #666;
                font-size: 0.9em;
            }
            .warning {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 5px;
                padding: 10px;
                margin: 15px 0;
                color: #856404;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="logo">⚽ TikiTakaToeRO</div>
                <h1 class="verify-title">Confirm your email address ✉️</h1>
            </div>
            
            <div class="content">
                <p>Hi <strong>${user.username}</strong>,</p>
                
                <p>To complete your account setup on TikiTakaToeRO, please confirm your email address by clicking the button below:</p>
                
                <div style="text-align: center;">
                    <a href="${verificationUrl}" class="cta-button">Confirm Email ✓</a>
                </div>
                
                <div class="highlight">
                    <p><strong>Why do you need to confirm your email?</strong></p>
                    <ul>
                        <li>To ensure the security of your account</li>
                        <li>To receive important notifications about games</li>
                        <li>To be able to recover your account if needed</li>
                    </ul>
                </div>
                
                <div class="warning">
                    <p><strong>⏰ Important:</strong> This verification link will expire in 24 hours for security reasons.</p>
                </div>
                
                <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
                <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 3px; font-family: monospace;">${verificationUrl}</p>
                
                <p>If you didn't create an account on TikiTakaToeRO, you can safely ignore this email.</p>
                
                <p>The <strong>TikiTakaToeRO</strong> Team</p>
            </div>

            <div class="footer">
                <p>© 2025 TikiTakaToeRO. All rights reserved.</p>
                <p><a href="https://tikitakatoe.ro" style="color: #2c5aa0;">www.tikitakatoe.ro</a> | <a href="mailto:contact@tikitakatoe.ro" style="color: #2c5aa0;">contact@tikitakatoe.ro</a></p>
            </div>
        </div>
    </body>
    </html>
  `;

  const text = `
Confirm your email address - TikiTakaToeRO

Hi ${user.username},

To complete your account setup on TikiTakaToeRO, please confirm your email address by accessing the following link:

${verificationUrl}

Why do you need to confirm your email?
• To ensure the security of your account
• To receive important notifications about games
• To be able to recover your account if needed

IMPORTANT: This verification link will expire in 24 hours for security reasons.

If you didn't create an account on TikiTakaToeRO, you can safely ignore this email.

The TikiTakaToeRO Team
© 2025 TikiTakaToeRO. All rights reserved.
www.tikitakatoe.ro
  `;

  return { html, text };
};

const getPasswordResetTemplate = (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_HOME_URL}reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset your password</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 0;
                background-color: #f8f9fa;
                color: #333;
            }
            .email-container {
                max-width: 600px;
                margin: 20px auto;
                background: white;
                border-radius: 10px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .logo {
                font-size: 1.5em;
                font-weight: bold;
                margin-bottom: 10px;
            }
            .reset-title {
                margin: 0;
                font-size: 1.8em;
                font-weight: 300;
                margin-bottom: 20px;
            }
            .content {
                padding: 30px;
                margin-bottom: 25px;
            }
            .cta-button {
                display: inline-block;
                background-color: #dc3545;
                color: white !important;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 5px;
                margin: 25px 0;
                text-align: center;
                font-weight: bold;
                font-size: 1.1em;
            }
            .cta-button:visited {
                color: white !important;
            }
            .cta-button:hover {
                background-color: #c82333;
                color: white !important;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding: 20px 30px;
                border-top: 1px solid #eee;
                color: #666;
                font-size: 0.9em;
            }
            .warning {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 5px;
                padding: 10px;
                margin: 15px 0;
                color: #856404;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="logo">⚽ TikiTakaToeRO</div>
                <h1 class="reset-title">Reset your password 🔒</h1>
            </div>
            
            <div class="content">
                <p>Hi <strong>${user.username}</strong>,</p>
                
                <p>You requested to reset your password for your TikiTakaToeRO account. Click the button below to reset your password:</p>
                
                <div style="text-align: center;">
                    <a href="${resetUrl}" class="cta-button">Reset Password 🔑</a>
                </div>
                
                <div class="warning">
                    <p><strong>⏰ Important:</strong> This password reset link will expire in 10 minutes for security reasons.</p>
                </div>
                
                <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
                <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 3px; font-family: monospace;">${resetUrl}</p>
                
                <p><strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
                
                <p>The <strong>TikiTakaToeRO</strong> Team</p>
            </div>

            <div class="footer">
                <p>© 2025 TikiTakaToeRO. All rights reserved.</p>
                <p><a href="https://tikitakatoe.ro" style="color: #2c5aa0;">www.tikitakatoe.ro</a> | <a href="mailto:contact@tikitakatoe.ro" style="color: #2c5aa0;">contact@tikitakatoe.ro</a></p>
            </div>
        </div>
    </body>
    </html>
  `;

  const text = `
Reset your password - TikiTakaToeRO

Hi ${user.username},

You requested to reset your password for your TikiTakaToeRO account. You can reset your password by accessing the following link:

${resetUrl}

IMPORTANT: This password reset link will expire in 10 minutes for security reasons.

Security Notice: If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

The TikiTakaToeRO Team
© 2025 TikiTakaToeRO. All rights reserved.
www.tikitakatoe.ro
  `;

  return { html, text };
};

module.exports = {
  getWelcomeTemplate,
  getEmailVerificationTemplate,
  getPasswordResetTemplate,
};
