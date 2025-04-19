import { Link } from "react-router-dom";
import "../styles/components/protected-page.css"; // Asigură-te că ai acest fișier CSS

function ProtectedPage() {
  return (
    <div className="access-denied-container">
      <h1>Access denied</h1>
      <p>You must be logged in to access this page.</p>
      <div className="button-group">
        <Link to="/" className="home-button">
          🏠 Go to Home
        </Link>
        <Link to="/login" className="login-button">
          🔐 Log in
        </Link>
      </div>
    </div>
  );
}

export default ProtectedPage;
