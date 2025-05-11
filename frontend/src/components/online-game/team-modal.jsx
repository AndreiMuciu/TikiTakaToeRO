import React from "react";
import Flag from "react-world-flags";

function TeamModal({ isOpen, onClose, items, onSelect }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Select a Team or Nationality</h2>
        <div className="item-grid">
          {items.map((item, index) => (
            <div
              key={index}
              className="item-card"
              onClick={() => {
                onSelect(item);
                onClose();
              }}
            >
              {item.type === "team" ? (
                <>
                  {console.log(item.logo)}
                  <img
                    src={`/logos/${item.data.logo}`}
                    alt={item.data.name}
                    className="team-logo"
                  />
                </>
              ) : (
                <Flag
                  code={item.data.flag}
                  style={{ width: "64px", height: "48px" }}
                />
              )}

              <p>{item.data.name}</p>
            </div>
          ))}
        </div>
        <button className="close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export default TeamModal;
