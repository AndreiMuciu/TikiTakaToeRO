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

module.exports = {
  getWelcomeTemplate,
};
