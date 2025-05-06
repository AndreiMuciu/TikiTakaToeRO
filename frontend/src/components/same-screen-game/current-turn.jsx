import React from "react";

const CurrentTurn = ({ currentPlayer, onSkipTurn }) => {
  return (
    <div className="current-turn">
      Current Turn:
      <span className={`turn-symbol ${currentPlayer}`}>{currentPlayer}</span>
      <button className="skip-button" onClick={onSkipTurn}>
        <span>Skip Turn</span>
      </button>
    </div>
  );
};

export default CurrentTurn;
