import "../styles/components/game-mode-btn.css"; // Import your CSS file for styling

function GameModeBtn({ onClick, text }) {
  return (
    <button onClick={onClick} className="cta-button primary">
      {text}
    </button>
  );
}

export default GameModeBtn;
