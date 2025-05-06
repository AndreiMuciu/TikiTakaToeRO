import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import LogoutButton from "../auth/logout-button";
import "../../styles/components/header.css"; // Import your CSS file for styling

const Header = () => {
  const [user, setUser] = useState(null);
  const apiUrl = import.meta.env.VITE_USERS_API_URL;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${apiUrl}me`, { withCredentials: true });
        setUser(res.data.data.user);
      } catch {
        setUser(null);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <header className="header">
      <div className="header-left">
        {/* Add logo img tag */}
        <img
          src="/TicTacToe.png" // Adjust path to your logo
          alt="TikiTakaToeRO Logo"
          className="logo-img"
        />
        <div className="header-left-content">
          <h1>TikiTakaToeRO</h1>
          <p>
            {user ? `Welcome back, ${user.username}!` : "Welcome to our app!"}
          </p>
        </div>
      </div>

      <nav className="nav-links">
        {user ? (
          <>
            <Link to="/profile" className="profile-link">
              Profile
            </Link>{" "}
            <LogoutButton onLogout={handleLogout} />
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Sign Up</Link>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;
