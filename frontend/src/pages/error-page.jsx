import { Link } from "react-router-dom";
import "../styles/components/error.css";

function ErrorPage() {
  return (
    <div className="notfound-container">
      <h1>404</h1>
      <p>Oops! The page you requested was not found.</p>
      <Link to="/" className="back-home-button">
        🏠 Go to Home
      </Link>
    </div>
  );
}

export default ErrorPage;
