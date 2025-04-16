import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import FormButton from "../components/form-button";
import FormInput from "../components/form-input";
import AuthWrapper from "../components/auth-wrapper";
import AuthSwitchMessage from "../components/auth-switch-message";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api/"; // Use the environment variable for the API URL

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`${apiUrl}login`, {
        email,
        password,
      });

      const { user } = response.data.data;
      const { token } = response.data;

      // Save the token to local storage or context
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Redirect to the dashboard or home page
      navigate("/");
    } catch (error) {
      // Handle error (e.g., show a message to the user)
      const errorMessage =
        error.response?.data?.message || "Login failed. Please try again.";
      setError(errorMessage); // Set the error message from the server response
    }
  };

  return (
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
        <AuthSwitchMessage
          question="Don't have an account yet?"
          linkText="Register here"
          linkTo="/register"
        />
        {error && <p className="error-message">{error}</p>}{" "}
        <FormButton text="Login" />
      </form>
    </AuthWrapper>
  );
}

export default LoginPage;
