import "../styles/components/auth-switch-message.css";
import { Link } from "react-router-dom";

function AuthSwitchMessage({ question, linkText, linkTo }) {
  return (
    <p className="auth-switch-message">
      {question} <Link to={linkTo}>{linkText}</Link>
    </p>
  );
}

export default AuthSwitchMessage;
