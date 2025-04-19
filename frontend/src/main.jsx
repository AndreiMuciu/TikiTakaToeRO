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
    element: <ProtectedRoute />,
    children: [
      {
        path: "/game",
        element: <GamePage />,
      },
      {
        path: "/profile",
        element: <Profile />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
