# TikiTakaToeRO ⚽❌⭕

TikiTakaToeRO is an interactive and educational web application that brings a touch of football strategy to the classic game of X and 0. Players choose football teams or nationalities for the rows and columns of the board, and to place an X or an O, they must enter a football player who has played for both teams (or who corresponds to that team and nationality).

🎮 Play now on: [tikitakatoe.ro](http://tikitakatoe.ro)

---

## 🔥 Main features

- 🧠 Unique gameplay – combines football with the logic of the X and 0 game
- 👥 Local multiplayer mode (on the same screen)
- 🌐 Online multiplayer mode (play with friends)
- 📦 Node.js + Express backend
- 💾 MongoDB database
- ⚛️ ReactJS frontend (with Vite)
- 🔐 User authentication (mandatory)
- 📱 Responsive design (play on mobile too)

---

## 📷 Screenshots

### Home Page

![Homepage](./screenshots/home.png)

### Game Page

![Game](./screenshots/game.png)

### Profile Page

![Profile](./screenshots/profile.png)

### Login Page

![Login](./screenshots/login.png)

---

## 🛠️ Technologies used

| Technology        | Description                                |
| ----------------- | ------------------------------------------ |
| Node.js & Express | REST API backend                           |
| MongoDB           | User, match, player data storage           |
| ReactJS (Vite)    | Fast and modular frontend                  |
| Socket.IO         | Real-time online multiplayer functionality |
| JWT               | API authentication and protection          |
| Oauth             | Google authentication                      |

---

## 📁 Project Structure

```
📂 backend/
  └── 📂 controllers
        └── 📄 authController.js
        └── 📄 handleFactory.js
        └── 📄 playerController.js
        └── 📄 teamController.js
        └── 📄 userController.js
  └── 📂 models
        └── 📄 playerModel.js
        └── 📄 teamModel.js
        └── 📄 userModel.js
  └── 📂 routes
        └── 📄 playerRoutes.js
        └── 📄 teamRoutes.js
        └── 📄 userRoutes.js
        └── 📄 oAuthRoutes.js
  └── 📂 utils
        └── 📄 APIFeatures.js
  └── 📄 app.js
  └── 📄 server.js
  └── 📄 socketServer.js
  └── 🔒 config.env
  └── 📦 package.json
  └── 📦 package-lock.json
📂 frontend/
  └── 📂 public
        └── 📂 logos
  └── 📂 src
        └── 📂 assets
        └── 📂 components
              └── 📂 auth
                    └── ⚛️ auth-switch-message.jsx
                    └── ⚛️ auth-wrapper.jsx
                    └── ⚛️ form-button.jsx
                    └── ⚛️ form-input.jsx
                    └── ⚛️ logout-button.jsx
              └── 📂 common
                    └── ⚛️ back-button.jsx
                    └── ⚛️ error-message.jsx
                    └── ⚛️ footer.jsx
                    └── ⚛️ header.jsx
              └── 📂 home
                    └── ⚛️ game-mode-btn.jsx
                    └── ⚛️ game-rules-btn.jsx
              └── 📂 online-game
                    └── ⚛️ team-modal.jsx
              └── 📂 same-screen-game
                    └── ⚛️ current-turn.jsx
                    └── ⚛️ game-over-modal.jsx
                    └── ⚛️ player-modal.jsx
                    └── ⚛️ team-modal.jsx
                    └── ⚛️ team-selector-cell.jsx
              └── ⚛️ protected-route.jsx
        └── 📂 pages
              └── ⚛️ create-invite-page.jsx
              └── ⚛️ error-page.jsx
              └── ⚛️ game-page-online.jsx
              └── ⚛️ game-page.jsx
              └── ⚛️ game-rules-page.jsx
              └── ⚛️ home-page.jsx
              └── ⚛️ login-page.jsx
              └── ⚛️ profile.jsx
              └── ⚛️ protected-page.jsx
              └── ⚛️ register-page.jsx
              └── ⚛️ select-league-page.jsx
        └── 📂 styles
              ... .css files
        └── 📄 dataStuff.js
        └── ⚛️ main.jsx
  └── 📦 package.json
  └── 📦 package-lock.json
🚫 .gitignore
```

---

## 🚀 How do I run the app locally?

### 1. Clone the repo

```bash
git clone https://github.com/AndreiMuciu/TikiTakaToeRO.git
cd tikitakatoe
```

### 2. Install dependencies

```bash
cd backend
npm install
```

```bash
cd frontend
npm install
```

### 3. Configure `.env` files

> ⚠️ These files contain sensitive information and should not be uploaded to Git. They are already added to .gitignore.

## `backend/config.env`

```env
PORT=5000
MONGO_URI=mongodb+srv://...
DB_PASSWORD=...
JWT_SECRET=...
JWT_EXPIRES_IN=...
JWT_COOKIE_EXPIRES_IN=...
OAUTH_CLIENT_ID_GOOGLE=...
OAUTH_CLIENT_SECRET_GOOGLE=...
FRONTEND_HOME_URL=http://localhost:5173/
```

## `frontend/.env`

```env
VITE_USERS_API_URL=http://localhost:5000/api/v1/users/
VITE_TEAMS_API_URL=http://localhost:5000/api/v1/teams/
VITE_PLAYERS_API_URL=http://localhost:5000/api/v1/players/
VITE_SOCKET_SERVER_URL=http://localhost:5000
VITE_AUTH_API_GOOGLE_URL=http://localhost:5000/api/v1/auth/google
VITE_INVITE_SOCKET_SERVER_URL=http://localhost:5000
```

### 4. Run the app

```bash
cd backend
npm run start-server
```

```bash
cd frontend
npm run dev
```

---

## 👤 Author

**Andrei-Constantin Mucioniu**  
🔗 [GitHub](https://github.com/AndreiMuciu)  
📧 constantinmucioniu@gmail.com  
🌐 [siteulmeu.com](https://andreimucioniu.netlify.app/)

---

## 📜 License

This project is released for educational purposes. Modify and explore freely!
