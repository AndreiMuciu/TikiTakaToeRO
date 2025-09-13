import axios from "axios";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/common/header";
import Footer from "../components/common/footer";
import "../styles/components/verify-email.css";

function VerifyEmail() {
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("");
  const { token } = useParams();
  const navigate = useNavigate();

  const apiUrl = import.meta.env.VITE_USERS_API_URL;

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await axios.get(`${apiUrl}verify-email/${token}`);

        if (response.data.status === "success") {
          setStatus("success");
          setMessage("Your email has been verified successfully!");
        } else {
          setStatus("error");
          setMessage("Failed to verify email. Please try again.");
        }
      } catch (error) {
        setStatus("error");
        if (error.response?.data?.message) {
          setMessage(error.response.data.message);
        } else {
          setMessage(
            "An error occurred while verifying your email. Please try again."
          );
        }
        console.error("Error verifying email:", error);
      }
    };

    if (token) {
      verifyEmail();
    } else {
      setStatus("error");
      setMessage("Invalid verification link.");
    }
  }, [token, apiUrl]);

  const handleRedirect = () => {
    navigate("/profile");
  };

  return (
    <>
      <Header />
      <div className="verify-email-container">
        <div className="verify-email-content">
          <div className="verify-email-icon">
            {status === "verifying" && <div className="spinner">⏳</div>}
            {status === "success" && <div className="success-icon">✅</div>}
            {status === "error" && <div className="error-icon">❌</div>}
          </div>

          <h1 className="verify-email-title">
            {status === "verifying" && "Verifying your email..."}
            {status === "success" && "Email Verified!"}
            {status === "error" && "Verification Failed"}
          </h1>

          <p className="verify-email-message">{message}</p>

          {status === "success" && (
            <button
              onClick={handleRedirect}
              className="redirect-button success"
            >
              Go to Profile
            </button>
          )}

          {status === "error" && (
            <div className="error-actions">
              <button onClick={handleRedirect} className="redirect-button">
                Go to Profile
              </button>
              <p className="help-text">
                You can resend the verification email from your profile page.
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default VerifyEmail;
