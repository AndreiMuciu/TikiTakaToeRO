import { useState } from "react";
import "../styles/components/game.css"; // Import your CSS file for styling
import Header from "../components/header";
import Footer from "../components/footer";

const GamePage = ({ getTeams, getValidPlayers }) => {
  const [rowTeams, setRowTeams] = useState([null, null, null]);
  const [colTeams, setColTeams] = useState([null, null, null]);
  const [grid, setGrid] = useState(
    Array(3)
      .fill(null)
      .map(() => Array(3).fill(null))
  );

  const handleTeamSelect = async (type, index) => {
    const teams = await getTeams();
    const team = prompt(`Alege o echipă:\n${teams.join("\n")}`);
    if (!team) return;

    if (type === "row") {
      const newRows = [...rowTeams];
      newRows[index] = team;
      setRowTeams(newRows);
    } else {
      const newCols = [...colTeams];
      newCols[index] = team;
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
                <div className="plus">+</div>
                <div>{team || "ADD"}</div>
              </div>
            ))}
          </div>

          {grid.map((row, rowIndex) => (
            <div className="grid-row" key={`row-${rowIndex}`}>
              <div
                className="team-selector"
                onClick={() => handleTeamSelect("row", rowIndex)}
              >
                <div className="plus">+</div>
                <div>{rowTeams[rowIndex] || "ADD"}</div>
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
