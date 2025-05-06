// components/error-message.jsx
import { useEffect } from "react";
import "../../styles/components/error-message.css"; // Adjust the path as necessary

const ErrorMessage = ({ message, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="error-message">
      <div className="error-content">
        <span>{message}</span>
        <button className="error-close" onClick={onClose}>
          &times;
        </button>
      </div>
    </div>
  );
};

export default ErrorMessage;
