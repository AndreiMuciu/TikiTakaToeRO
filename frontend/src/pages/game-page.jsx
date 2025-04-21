import { useState } from "react";
import "../styles/components/game.css"; // Import your CSS file for styling
import Header from "../components/header";
import Footer from "../components/footer";
import axios from "axios";
import { useParams } from "react-router-dom";

const GamePage = () => {
  const [rowTeams, setRowTeams] = useState([null, null, null]);
  const [colTeams, setColTeams] = useState([null, null, null]);
  const [grid, setGrid] = useState(
    Array(3)
      .fill(null)
      .map(() => Array(3).fill(null))
  );
  const apiTeams = import.meta.env.VITE_TEAMS_API_URL;
  const { league } = useParams();

  const getTeams = async () => {
    try {
      const response = await axios.get(
        `${apiTeams}?country=${league}&sort=name`
      );
      console.log(response.data.data.data);
      return response.data.data.data;
    } catch (error) {
      console.error("Error fetching teams:", error);
      return [];
    }
  };
  const getValidPlayers = async (teamA, teamB) => {
    try {
      const response = await axios.get(`/api/players`, {
        params: { teamA, teamB, league: league },
      });
      return response.data.players;
    } catch (error) {
      console.error("Error fetching players:", error);
      return [];
    }
  };

  const handleTeamSelect = async (type, index) => {
    if (
      (type === "row" && rowTeams[index] !== null) ||
      (type === "col" && colTeams[index] !== null)
    ) {
      alert("Nu poți schimba echipa deja selectată!");
      return;
    }

    const teams = await getTeams();
    const teamNames = teams.map((team) => team.name);
    const team = prompt(`Alege o echipă:\n${teamNames.join("\n")}`);
    const selectedTeam = teams.find((t) => t.name === team);

    if (!selectedTeam || !teamNames.includes(team)) {
      alert("Echipa nu este validă. Te rog să alegi una din listă.");
      return;
    }

    // Verificare unicătate
    if (type === "row") {
      const existsInOtherRows = rowTeams.some(
        (t, i) => i !== index && t?._id === selectedTeam._id
      );
      const existsInCols = colTeams.some((t) => t?._id === selectedTeam._id);

      if (existsInOtherRows || existsInCols) {
        alert("Această echipă a fost deja adăugată!");
        return;
      }
    } else {
      const existsInOtherCols = colTeams.some(
        (t, i) => i !== index && t?._id === selectedTeam._id
      );
      const existsInRows = rowTeams.some((t) => t?._id === selectedTeam._id);

      if (existsInOtherCols || existsInRows) {
        alert("Această echipă a fost deja adăugată!");
        return;
      }
    }

    // Actualizare stare
    if (type === "row") {
      const newRows = [...rowTeams];
      newRows[index] = selectedTeam;
      setRowTeams(newRows);
    } else {
      const newCols = [...colTeams];
      newCols[index] = selectedTeam;
      setColTeams(newCols);
    }
  };

  const handlePlayerSelect = async (row, col) => {
    const teamA = rowTeams[row];
    const teamB = colTeams[col];
    if (!teamA || !teamB) {
      alert("Selectează mai întâi echipele!");
      return;
    }

    const validPlayers = await getValidPlayers(teamA, teamB);
    const player = prompt(`Alege un jucător:\n${validPlayers.join("\n")}`);
    if (player) {
      const newGrid = [...grid];
      newGrid[row][col] = player;
      setGrid(newGrid);
    }
  };

  return (
    <>
      <Header />
      <div className="page-wrapper">
        <div className="tiki-taka-toe">
          <div className="header-row">
            <div className="logo-cell"></div>
            {colTeams.map((team, i) => (
              <div
                key={`col-${i}`}
                className="team-selector"
                onClick={() => handleTeamSelect("col", i)}
              >
                {team ? (
                  <>
                    <img
                      src={`/logos/${team.logo}`}
                      alt={team.logo}
                      className="team-logo"
                    />
                  </>
                ) : (
                  <>
                    <div className="plus">+</div>
                    <div>ADD</div>
                  </>
                )}
              </div>
            ))}
          </div>

          {grid.map((row, rowIndex) => (
            <div className="grid-row" key={`row-${rowIndex}`}>
              <div
                className="team-selector"
                onClick={() => handleTeamSelect("row", rowIndex)}
              >
                {rowTeams[rowIndex] ? (
                  <>
                    <img
                      src={`/logos/${rowTeams[rowIndex].logo}`}
                      alt={rowTeams[rowIndex].logo}
                      className="team-logo"
                    />
                  </>
                ) : (
                  <>
                    <div className="plus">+</div>
                    <div>ADD</div>
                  </>
                )}
              </div>
              {row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className="cell"
                  onClick={() => handlePlayerSelect(rowIndex, colIndex)}
                >
                  {cell ? (
                    <span>{cell}</span>
                  ) : (
                    <span className="placeholder">+</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default GamePage;
