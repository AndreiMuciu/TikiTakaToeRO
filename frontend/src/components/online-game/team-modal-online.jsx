import { useEffect, useState } from "react";
import axios from "axios";
import { europeanTopTeamIds } from "../../dataStuff";

const teamsApiURL = import.meta.env.VITE_TEAMS_API_URL;

function TeamModalOnline({ type, onClose, onSelect, nationalities, league }) {
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await axios.get(`${teamsApiURL}?country=${league}`);

        console.log("Teams API URL:", league);

        console.log("Fetched teams:", res);
        let filtered = res.data.data.data;

        if (league === "europe") {
          filtered = filtered.filter((team) =>
            europeanTopTeamIds.includes(team._id)
          );
        }

        setTeams(filtered);
      } catch (err) {
        console.error("Failed to load teams:", err);
      }
    };

    fetchTeams();
  }, [league]);

  const handleSelect = (item) => {
    onSelect({
      type: type,
      data: item,
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Select a {type === "row" ? "nationality" : "team"}</h2>
        <button onClick={onClose}>Close</button>

        <div className="item-list">
          {type === "row"
            ? nationalities.map((nat) => (
                <div key={nat.code} onClick={() => handleSelect(nat)}>
                  <img
                    src={`https://flagsapi.com/${nat.flag}/flat/64.png`}
                    alt={nat.name}
                  />
                  <p>{nat.name}</p>
                </div>
              ))
            : teams.map((team) => (
                <div key={team._id} onClick={() => handleSelect(team)}>
                  <img src={`/logos/${team.logo}`} alt={team.name} />
                  <p>{team.name}</p>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}

export default TeamModalOnline;
