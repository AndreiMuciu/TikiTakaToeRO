import { useNavigate } from "react-router-dom";

function BackButton({ text, navigateTo, className }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(navigateTo)}
      className={`back-button ${className}`}
    >
      {text}
    </button>
  );
}

export default BackButton;
