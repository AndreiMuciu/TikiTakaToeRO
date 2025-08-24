import FormInput from "../components/auth/form-input";
import FormButton from "../components/auth/form-button";
import AuthWrapper from "../components/auth/auth-wrapper";
import AuthSwitchMessage from "../components/auth/auth-switch-message";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/components/register-err.css";
import BackButton from "../components/common/back-button";

function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [username, setUsername] = useState(""); // Corectat aici
  const [error, setError] = useState({});
  const navigate = useNavigate();

  const apiUrl = import.meta.env.VITE_USERS_API_URL;

  useEffect(() => {
    document.body.classList.add("login");
    return () => {
      document.body.classList.remove("login");
    };
  }, []);

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
    <>
      <AuthWrapper title="Register">
        <div className="home-button-fixed">
          <BackButton navigateTo="/" text="Home" />
        </div>
        <form onSubmit={handleSignup}>
          <FormInput
            label="Username"
            name="name"
            value={username}
            onChange={(e) => setUsername(e.target.value)} // Corectat aici
            placeholder="Enter your username"
          />
          {error.username && <p className="error-messagee">{error.username}</p>}
          <FormInput
            label="Email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
          {error.email && <p className="error-messagee">{error.email}</p>}
          <FormInput
            label="Password"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          {error.password && <p className="error-messagee">{error.password}</p>}
          <FormInput
            label="Password Confirmation"
            type="password"
            name="passwordConfirm"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            placeholder="••••••••"
          />
          {error.passwordConfirm && (
            <p className="error-messagee">{error.passwordConfirm}</p>
          )}
          <AuthSwitchMessage
            question="Already have an account?"
            linkText="Login here"
            linkTo="/login"
          />
          {error.general && <p className="error-messagee">{error.general}</p>}{" "}
          <FormButton text="Register" />
        </form>
      </AuthWrapper>
    </>
  );
}

export default RegisterPage;
