import { Link } from "react-router-dom";

function HomePage() {
  return (
    <div>
      <h1>Welcome to Home Page</h1>
      <nav>
        <Link to="/login">Login</Link> | <Link to="/register">Register</Link>
      </nav>
    </div>
  );
}

export default HomePage;
