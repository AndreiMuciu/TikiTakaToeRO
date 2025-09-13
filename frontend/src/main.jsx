import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./styles/global.css";
//import App from "./App.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import HomePage from "./pages/home-page.jsx";
import GamePage from "./pages/game-page.jsx";
import RegisterPage from "./pages/register-page.jsx";
import GameRulesPage from "./pages/game-rules-page.jsx";
import LoginPage from "./pages/login-page.jsx";
import ErrorPage from "./pages/error-page.jsx";
import ProtectedRoute from "./components/protected-route.jsx";
import Profile from "./pages/profile.jsx";
import ProtectedPage from "./pages/protected-page.jsx";
import SelectLeague from "./pages/select-league.jsx";
import GamePageOnline from "./pages/game-page-online.jsx";
import CreateInvitePage from "./pages/create-invite-page.jsx";
import InviteGamePage from "./pages/invite-game-page.jsx";
import VerifyEmail from "./pages/verify-email.jsx";
import ForgotPassword from "./pages/forgot-password.jsx";
import ResetPassword from "./pages/reset-password.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/game-rules",
    element: <GameRulesPage />,
  },
  {
    path: "/access-denied",
    element: <ProtectedPage />,
  },
  {
    path: "/verify-email/:token",
    element: <VerifyEmail />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
  {
    path: "/game-same-screen",
    element: <SelectLeague />,
  },
  {
    path: "/game-same-screen/:league",
    element: <GamePage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/game-online",
        element: <SelectLeague />,
      },
      {
        path: "/game-online/:league",
        element: <GamePageOnline />,
      },
      {
        path: "/invite-create",
        element: <SelectLeague />,
      },
      {
        path: "/invite-create/:league",
        element: <CreateInvitePage />,
      },
      {
        path: "/invite-game/:league",
        element: <InviteGamePage />,
      },
      {
        path: "/profile",
        element: <Profile />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  //<StrictMode>
  <RouterProvider router={router} />
  //</StrictMode>
);
