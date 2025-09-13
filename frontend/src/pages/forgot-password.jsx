import axios from "axios";
import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/common/header";
import Footer from "../components/common/footer";
import "../styles/components/forgot-password.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const apiUrl = import.meta.env.VITE_USERS_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await axios.post(`${apiUrl}forgot-password`, { email });

      if (response.data.status === "success") {
        setMessage(
          "Password reset email sent! Please check your inbox and follow the link to your profile to update your password."
        );
        setEmail("");
      } else {
        setError("Failed to send reset email. Please try again.");
      }
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("An error occurred. Please try again.");
      }
      console.error("Error sending forgot password email:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="forgot-password-container">
        <div className="forgot-password-card">
          <div className="forgot-password-header">
            <h1>Forgot Password? 🔒</h1>
            <p>
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="forgot-password-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                disabled={isLoading}
                className="form-input"
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            {message && <div className="success-message">{message}</div>}

            <button
              type="submit"
              disabled={isLoading || !email}
              className="submit-button"
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <div className="forgot-password-footer">
            <p>
              Remember your password? <Link to="/login">Back to Login</Link>
            </p>
            <p>
              Don't have an account? <Link to="/register">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default ForgotPassword;
