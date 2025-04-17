import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/components/logout.css"; // Importăm fișierul CSS pentru LogoutButton

const LogoutButton = ({ onLogout }) => {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_USERS_API_URL;

  const handleLogout = async () => {
    try {
      await axios.get(`${apiUrl}logout`, { withCredentials: true });
      onLogout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <button onClick={handleLogout} className="logout-button">
      Logout
    </button>
  );
};

export default LogoutButton;
