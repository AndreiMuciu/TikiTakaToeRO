import Flag from "react-world-flags";

const TeamModal = ({ show, teams, nationalities, onSelect, onClose }) => {
  if (!show) return null;

  return (
    <div
      className="team-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="team-modal">
        <h2>Choose a team</h2>
        <div className="team-grid">
          {teams.map((team) => (
            <div
              key={team._id}
              className="item-card"
              onClick={() => onSelect(team, false)}
            >
              <img
                src={`/logos/${team.logo}`}
                alt={team.name}
                className="team-modal-logo"
              />
              <span className="team-name">{team.name}</span>
            </div>
          ))}

          {nationalities.map((nat) => (
            <div
              key={nat.flag}
              className="item-card"
              onClick={() => onSelect(nat, true)}
            >
              <Flag code={nat.flag.toUpperCase()} className="team-modal-logo" />
              <span className="team-name">{nat.name}</span>
            </div>
          ))}
        </div>

        <button className="modal-close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default TeamModal;
