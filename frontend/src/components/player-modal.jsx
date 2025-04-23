import React, { useEffect, useRef } from "react";

const PlayerModal = ({
  show,
  players = [],
  query,
  validPlayers = [],
  onClose,
  onSearch,
  onSelect,
}) => {
  const searchInputRef = useRef(null);
  useEffect(() => {
    if (show) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [show]);

  if (!show) return null;

  const filteredPlayers = players.filter((player) =>
    player.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="player-modal-overlay" onClick={onClose}>
      <div className="player-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Select a player</h2>
        <input
          ref={searchInputRef}
          type="text"
          className="search-bar"
          placeholder="Search players..."
          value={query}
          onChange={(e) => onSearch(e.target.value)}
        />
        <div className="player-grid">
          {filteredPlayers.map((player) => {
            const isValid = validPlayers.some((p) => p._id === player._id);
            return (
              <div
                key={player._id}
                className={`player-card`}
                onClick={() => onSelect(player)}
              >
                <div className="player-name">{player.name}</div>
                <div className="club-info">
                  {[player.currentClub, ...(player.formerClubs || [])].join(
                    " → "
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <button className="modal-close-btn" onClick={onClose}>
          Închide
        </button>
      </div>
    </div>
  );
};

export default React.memo(PlayerModal);
