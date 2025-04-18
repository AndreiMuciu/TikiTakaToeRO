import FormInput from "../components/form-input";
import FormButton from "../components/form-button";
import AuthWrapper from "../components/auth-wrapper";
import AuthSwitchMessage from "../components/auth-switch-message";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [username, setUserame] = useState("");
  const [error, setError] = useState("");
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

      navigate("/");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Registration failed. Please try again.";
      setError(errorMessage); // Set the error message from the server response
    }
  };

  return (
    <AuthWrapper title="Register">
      <form onSubmit={handleSignup}>
        <FormInput
          label="Username"
          name="name"
          value={username}
          onChange={(e) => setUserame(e.target.value)}
          placeholder="Enter your username"
        />
        <FormInput
          label="Password"
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
        <FormInput
          label="Password Confirmation"
          type="password"
          name="passwordConfirm"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          placeholder="••••••••"
        />
        <FormInput
          label="Email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
        />
        <AuthSwitchMessage
          question="Already have an account?"
          linkText="Login here"
          linkTo="/login"
        />
        {error && <p className="error-message">{error}</p>}{" "}
        <FormButton text="Register" />
      </form>
    </AuthWrapper>
  );
}

export default RegisterPage;
