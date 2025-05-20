// components/TeamModal.jsx
import React from "react";
import Flag from "react-world-flags";

function TeamModal({ isOpen, onClose, items, onSelect }) {
  if (!isOpen) return null;

  return (
    <div
      className="team-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="team-modal">
        <h2>Choose a team or nationality</h2>
        <div className="team-grid">
          {items.map((item, index) => (
            <div
              key={index}
              className="team-card"
              onClick={() => {
                onSelect(item);
                onClose();
              }}
            >
              {item.type === "team" ? (
                <img
                  src={`/logos/${item.data.logo}`}
                  alt={item.data.name}
                  className="team-modal-logo"
                />
              ) : (
                <Flag
                  code={item.data.flag.toUpperCase()}
                  className="flag-icon"
                />
              )}
              <span className="team-name">{item.data.name}</span>
            </div>
          ))}
        </div>
        <button className="modal-close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export default TeamModal;
