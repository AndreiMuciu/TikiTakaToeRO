import FormInput from "../components/form-input";
import FormButton from "../components/form-button";
import AuthWrapper from "../components/auth-wrapper";
import AuthSwitchMessage from "../components/auth-switch-message";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/components/register-err.css";

function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [username, setUsername] = useState(""); // Corectat aici
  const [error, setError] = useState({});
  const navigate = useNavigate();

  const apiUrl = import.meta.env.VITE_USERS_API_URL;

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        `${apiUrl}signup`,
        {
          email,
          password,
          passwordConfirm,
          username,
        },
        { withCredentials: true } // for sending cookies with the request
      );

      navigate("/"); // Redirecționează utilizatorul pe home page
    } catch (error) {
      const errorObj = error.response?.data?.errors || {
        general: error.response?.data?.general,
      };
      setError(errorObj); // Set the error message from the server response
    }
  };

  return (
    <AuthWrapper title="Register">
      <form onSubmit={handleSignup}>
        <FormInput
          label="Username"
          name="name"
          value={username}
          onChange={(e) => setUsername(e.target.value)} // Corectat aici
          placeholder="Enter your username"
        />
        {error.username && <p className="error-message">{error.username}</p>}
        <FormInput
          label="Password"
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
        {error.password && <p className="error-message">{error.password}</p>}
        <FormInput
          label="Password Confirmation"
          type="password"
          name="passwordConfirm"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          placeholder="••••••••"
        />
        {error.passwordConfirm && (
          <p className="error-message">{error.passwordConfirm}</p>
        )}
        <FormInput
          label="Email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
        />
        {error.email && <p className="error-message">{error.email}</p>}
        <AuthSwitchMessage
          question="Already have an account?"
          linkText="Login here"
          linkTo="/login"
        />
        {error.general && <p className="error-message">{error.general}</p>}{" "}
        <FormButton text="Register" />
      </form>
    </AuthWrapper>
  );
}

export default RegisterPage;
