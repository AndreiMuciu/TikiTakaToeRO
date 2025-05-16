import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import FormButton from "../components/auth/form-button";
import FormInput from "../components/auth/form-input";
import AuthWrapper from "../components/auth/auth-wrapper";
import AuthSwitchMessage from "../components/auth/auth-switch-message";
import "../styles/components/home-btn-form.css";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const apiUrl = import.meta.env.VITE_USERS_API_URL;

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        `${apiUrl}login`,
        {
          email,
          password,
        },
        { withCredentials: true } // for sending cookies with the request
      );

      navigate("/");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Login failed. Please try again.";
      setError(errorMessage); // Set the error message from the server response
    }
  };

  return (
    <>
      <div className="home-button-fixed">
        <a href="/" className="home-button-form">
          Home
        </a>
      </div>
      <AuthWrapper title="Login">
        <form onSubmit={handleLogin}>
          <FormInput
            label="Email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
          <FormInput
            label="Password"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          {error && <p className="error-message">{error}</p>}{" "}
          <AuthSwitchMessage
            question="Don't have an account yet?"
            linkText="Register here"
            linkTo="/register"
          />
          <FormButton text="Login" />
          <div className="google-login-wrapper">
            <p>or</p>
            <a
              href="http://localhost:5000/api/v1/auth/google"
              className="google-login-button"
            >
              <img
                src="https://developers.google.com/identity/images/g-logo.png"
                alt="Google logo"
              />
              Continue with Google
            </a>
          </div>
        </form>
      </AuthWrapper>
    </>
  );
}

export default LoginPage;
