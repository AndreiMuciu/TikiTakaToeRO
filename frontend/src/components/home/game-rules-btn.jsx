import "../../styles/components/game-rules-btn.css"; // Import your CSS file for styling

function GameRulesBtn({ onClick, text }) {
  return (
    <button onClick={onClick} className="cta-button secondary">
      {text}
    </button>
  );
}

export default GameRulesBtn;
