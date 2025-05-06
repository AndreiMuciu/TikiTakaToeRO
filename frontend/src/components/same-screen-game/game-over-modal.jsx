// components/GameOverModal.jsx
import React from "react";

const GameOverModal = ({ winner, onReset, onHome }) => {
  return (
    <div className="game-over-overlay">
      <div className="game-status">
        <h2>{winner === "draw" ? "Draw!" : `Winner: ${winner}`}</h2>
        <div className="game-buttons">
          <button onClick={onReset}>
            <span>Play again</span>
          </button>
          <button onClick={onHome}>
            <span>Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverModal;
