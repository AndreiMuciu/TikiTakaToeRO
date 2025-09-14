import axios from "axios";
import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Header from "../components/common/header";
import Footer from "../components/common/footer";
import "../styles/components/reset-password.css";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");
  const apiUrl = import.meta.env.VITE_USERS_API_URL;

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError(
          "Invalid or missing reset token. Please request a new password reset."
        );
        setIsValidatingToken(false);
        setTokenValid(false);
        return;
      }

      try {
        const response = await axios.get(
          `${apiUrl}validate-reset-token/${token}`
        );

        if (response.data.status === "success") {
          setTokenValid(true);
          setError("");
        } else {
          setError("Token is invalid or has expired.");
          setTokenValid(false);
        }
      } catch (err) {
        if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else {
          setError(
            "Token is invalid or has expired. Please request a new password reset."
          );
        }
        setTokenValid(false);
      } finally {
        setIsValidatingToken(false);
      }
    };

    validateToken();
  }, [token, apiUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setError("Invalid or missing reset token.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await axios.patch(
        `${apiUrl}reset-password/${token}`,
        { password, passwordConfirm },
        { withCredentials: true }
      );

      if (response.data.status === "success") {
        setMessage(response.data.message);
        setPassword("");
        setPasswordConfirm("");

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setError("Failed to reset password. Please try again.");
      }
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("An error occurred. Please try again.");
      }
      console.error("Error resetting password:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while validating token
  if (isValidatingToken) {
    return (
      <>
        <Header />
        <div className="reset-password-container">
          <div className="reset-password-card">
            <div className="reset-password-header">
              <h1>Validating Reset Link... ⏳</h1>
              <p>Please wait while we verify your password reset token.</p>
            </div>

            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Invalid token state
  if (!token || !tokenValid) {
    return (
      <>
        <Header />
        <div className="reset-password-container">
          <div className="reset-password-card">
            <div className="reset-password-header">
              <h1>Invalid Reset Link ❌</h1>
              <p>
                This password reset link is invalid or has expired. Please
                request a new password reset.
              </p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="reset-password-footer">
              <p>
                <Link to="/forgot-password">Request new password reset</Link>
              </p>
              <p>
                <Link to="/login">Back to Login</Link>
              </p>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Valid token - show password reset form

  return (
    <>
      <Header />
      <div className="reset-password-container">
        <div className="reset-password-card">
          <div className="reset-password-header">
            <h1>Reset Your Password 🔒</h1>
            <p>
              Enter your new password below. Make sure it's strong and secure!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="reset-password-form">
            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your new password"
                required
                disabled={isLoading}
                className="form-input"
                minLength="8"
              />
            </div>

            <div className="form-group">
              <label htmlFor="passwordConfirm">Confirm New Password</label>
              <input
                type="password"
                id="passwordConfirm"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Confirm your new password"
                required
                disabled={isLoading}
                className="form-input"
                minLength="8"
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            {message && (
              <div className="success-message">
                {message}
                <br />
                <small>Redirecting to home page in 3 seconds...</small>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !password || !passwordConfirm}
              className="submit-button"
            >
              {isLoading ? "Updating Password..." : "Update Password"}
            </button>
          </form>

          <div className="reset-password-footer">
            <p>
              Remember your password? <Link to="/login">Back to Login</Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default ResetPassword;
