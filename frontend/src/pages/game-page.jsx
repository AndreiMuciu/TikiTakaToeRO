import { useState, useEffect } from "react";
import "../styles/components/game.css"; // Import your CSS file for styling
import Header from "../components/header";
import Footer from "../components/footer";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const GamePage = () => {
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [modalType, setModalType] = useState(null); // 'row' sau 'col'
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [teams, setTeams] = useState([]);

  const [currentPlayer, setCurrentPlayer] = useState("X");
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const navigate = useNavigate();

  const [rowTeams, setRowTeams] = useState([null, null, null]);
  const [colTeams, setColTeams] = useState([null, null, null]);
  const [grid, setGrid] = useState(
    Array(3)
      .fill(null)
      .map(() =>
        Array(3)
          .fill(null)
          .map(() => ({ player: null, symbol: null }))
      )
  );
  const apiTeams = import.meta.env.VITE_TEAMS_API_URL;
  const apiPlayers = import.meta.env.VITE_PLAYERS_API_URL;
  const { league } = useParams();

  const getTeams = async () => {
    try {
      const response = await axios.get(
        `${apiTeams}?country=${league}&sort=name`
      );
      return response.data.data.data;
    } catch (error) {
      console.error("Error fetching teams:", error);
      return [];
    }
  };
  useEffect(() => {
    const loadTeams = async () => {
      const loadedTeams = await getTeams();
      setTeams(loadedTeams);
    };
    loadTeams();
  }, []);
  const getValidPlayers = async (team1, team2) => {
    try {
      const response = await axios.get(`${apiPlayers}played-for-two-teams`, {
        params: { team1, team2 },
      });
      console.log(response);
      return response.data.data.players;
    } catch (error) {
      console.error("Error fetching players:", error);
      return [];
    }
  };

  const handleTeamSelect = (type, index) => {
    if (
      (type === "row" && rowTeams[index] !== null) ||
      (type === "col" && colTeams[index] !== null)
    ) {
      alert("Nu poți schimba echipa deja selectată!");
      return;
    }

    setModalType(type);
    setSelectedIndex(index);
    setShowTeamModal(true);
  };

  const handleTeamSelection = (selectedTeam) => {
    const isRow = modalType === "row";
    const teamsArray = isRow ? rowTeams : colTeams;
    const otherArray = isRow ? colTeams : rowTeams;

    // Verifică dacă echipa este deja selectată
    const existsInCurrent = teamsArray.some((t) => t?._id === selectedTeam._id);
    const existsInOther = otherArray.some((t) => t?._id === selectedTeam._id);

    if (existsInCurrent || existsInOther) {
      alert("Această echipă a fost deja adăugată!");
      return;
    }

    if (isRow) {
      const newRows = [...rowTeams];
      newRows[selectedIndex] = selectedTeam;
      setRowTeams(newRows);
    } else {
      const newCols = [...colTeams];
      newCols[selectedIndex] = selectedTeam;
      setColTeams(newCols);
    }

    setShowTeamModal(false);
  };

  const handlePlayerSelect = async (row, col) => {
    if (gameOver) {
      alert("Jocul s-a terminat!");
      return;
    }

    if (grid[row][col].symbol !== null) {
      alert("Această celulă este deja ocupată!");
      return;
    }

    const teamA = rowTeams[row];
    const teamB = colTeams[col];

    if (!teamA || !teamB) {
      alert("Selectează mai întâi echipele!");
      return;
    }

    const validPlayers = await getValidPlayers(teamA._id, teamB._id);
    const playerNames = validPlayers.map((player) => player.name);
    const player = prompt(`Alege un jucător:\n${playerNames.join("\n")}`);

    if (player && playerNames.includes(player)) {
      const selectedPlayer = validPlayers.find((p) => p.name === player);

      const newGrid = [...grid];
      newGrid[row] = [...newGrid[row]]; // Copy the row
      newGrid[row][col] = {
        player: selectedPlayer,
        symbol: currentPlayer,
      };

      setGrid(newGrid);

      const winnerResult = checkForWinner(newGrid);
      if (winnerResult) {
        setGameOver(true);
        setWinner(winnerResult === "draw" ? "draw" : winnerResult);
      } else {
        setCurrentPlayer((prev) => (prev === "X" ? "O" : "X"));
      }
    }
  };

  const checkForWinner = (grid) => {
    // Verifică linii
    for (let i = 0; i < 3; i++) {
      if (
        grid[i][0].symbol &&
        grid[i][0].symbol === grid[i][1].symbol &&
        grid[i][1].symbol === grid[i][2].symbol
      ) {
        return grid[i][0].symbol;
      }
    }

    // Verifică coloane
    for (let j = 0; j < 3; j++) {
      if (
        grid[0][j].symbol &&
        grid[0][j].symbol === grid[1][j].symbol &&
        grid[1][j].symbol === grid[2][j].symbol
      ) {
        return grid[0][j].symbol;
      }
    }

    // Verifică diagonale
    if (
      grid[0][0].symbol &&
      grid[0][0].symbol === grid[1][1].symbol &&
      grid[1][1].symbol === grid[2][2].symbol
    ) {
      return grid[0][0].symbol;
    }

    if (
      grid[0][2].symbol &&
      grid[0][2].symbol === grid[1][1].symbol &&
      grid[1][1].symbol === grid[2][0].symbol
    ) {
      return grid[0][2].symbol;
    }

    // Verifică remiză
    const isDraw = grid.flat().every((cell) => cell.symbol !== null);
    return isDraw ? "draw" : null;
  };

  const resetGame = () => {
    setGrid(
      Array(3)
        .fill(null)
        .map(() =>
          Array(3)
            .fill(null)
            .map(() => ({ player: null, symbol: null }))
        )
    );
    setCurrentPlayer("X");
    setGameOver(false);
    setWinner(null);
  };

  return (
    <>
      <Header />
      <div className="page-wrapper">
        <button className="back-button-x" onClick={() => navigate(-1)}>
          ← Back to Leagues
        </button>
        <div className="current-turn">
          Current Turn:
          <span className={`turn-symbol ${currentPlayer}`}>
            {currentPlayer}
          </span>
        </div>

        {showTeamModal && (
          <div className="team-modal-overlay">
            <div className="team-modal">
              <h2>Choose a team</h2>
              <div className="team-grid">
                {teams.map((team) => (
                  <div
                    key={team._id}
                    className="team-card"
                    onClick={() => handleTeamSelection(team)}
                  >
                    <img
                      src={`/logos/${team.logo}`}
                      alt={team.name}
                      className="team-modal-logo"
                    />
                    <span className="team-name">{team.name}</span>
                  </div>
                ))}
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setShowTeamModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}

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
                    <span>{cell.symbol}</span>
                  ) : (
                    <span className="placeholder">+</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
        {gameOver && (
          <div className="game-over-overlay">
            <div className="game-status">
              <h2>{winner === "draw" ? "Draw!" : `Winner: ${winner}`}</h2>
              <button onClick={resetGame}>
                <span>Play again</span>
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default GamePage;
