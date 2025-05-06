// components/TeamSelectorCell.jsx
import React from "react";
import Flag from "react-world-flags";

const TeamSelectorCell = ({ item, onClick }) => {
  return (
    <div
      className={`team-selector ${item ? "occupied" : ""}`}
      onClick={onClick}
    >
      {item ? (
        item.type === "team" ? (
          <img
            src={`/logos/${item.data.logo}`}
            alt={item.data.name}
            className="team-logo"
          />
        ) : (
          <Flag code={item.data.flag.toUpperCase()} className="flag-icon" />
        )
      ) : (
        <>
          <div className="plus">+</div>
          <div>ADD</div>
        </>
      )}
    </div>
  );
};

export default TeamSelectorCell;
