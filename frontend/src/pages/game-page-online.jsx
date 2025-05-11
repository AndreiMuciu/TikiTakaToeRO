import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios"; // <-- Import Axios
import "../styles/components/game-online.css";
import {
  uefaCountries,
  SuperligaNationalities,
  europeanTopTeamIds,
} from "../dataStuff";
import TeamModal from "../components/online-game/team-modal";
import ErrorMessage from "../components/common/error-message";
import Flag from "react-world-flags";

const socketServerUrl = import.meta.env.VITE_SOCKET_SERVER_URL;
const apiUserUrl = import.meta.env.VITE_USERS_API_URL;

function GamePageOnline() {
  const navigate = useNavigate();
  const { league } = useParams();
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [grid, setGrid] = useState(
    Array(3)
      .fill(null)
      .map(() =>
        Array(3)
          .fill(null)
          .map(() => ({ player: null, symbol: null }))
      )
  );

  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);

  const [currentPlayerSymbol, setCurrentPlayerSymbol] = useState(null);
  const [myTurn, setMyTurn] = useState(false);

  const [rowItems, setRowItems] = useState(Array(3).fill(null));
  const [colItems, setColItems] = useState(Array(3).fill(null));

  const [teamSelectionTurn, setTeamSelectionTurn] = useState("X");

  const [modalType, setModalType] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [teams, setTeams] = useState([]);

  const allSelectableItems =
    league === "europe"
      ? [
          ...uefaCountries.map((nat) => ({
            type: "nationality",
            data: { name: nat.name, flag: nat.flag },
          })),
          ...teams.map((team) => ({
            type: "team",
            data: { name: team.name, logo: team.logo },
          })),
        ]
      : [
          ...SuperligaNationalities.map((nat) => ({
            type: "nationality",
            data: { name: nat.name, flag: nat.flag },
          })),
          ...teams.map((team) => ({
            type: "team",
            data: { name: team.name, logo: team.logo },
          })),
        ];

  const apiTeams = import.meta.env.VITE_TEAMS_API_URL;

  useEffect(() => {
    const loadTeams = async () => {
      const teamsData = await getTeams();
      setTeams(teamsData);
    };
    loadTeams();
  }, [league]);

  const getTeams = async () => {
    try {
      console.log("Current Path:", league);
      if (league === "europe") {
        const europeanTeams = await axios.get(`${apiTeams}by-ids`, {
          params: { ids: europeanTopTeamIds.join(",") },
        });
        console.log(europeanTeams.data.data.teams);
        return europeanTeams.data.data.teams;
      }
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
    let newSocket;

    const fetchUserAndConnect = async () => {
      try {
        const res = await axios.get(`${apiUserUrl}me`, {
          withCredentials: true,
        });
        const userId = res.data.data.user._id;
        setUserId(userId);

        newSocket = io(socketServerUrl, {
          withCredentials: true,
          query: {
            leagueId: league,
            userId: userId,
          },
        });

        setSocket(newSocket);

        newSocket.on("update_team_turn", ({ nextTurn }) => {
          setTeamSelectionTurn(nextTurn);
        });

        newSocket.on("start_game", ({ roomId, symbols }) => {
          setRoomId(roomId);
          const mySymbol = symbols[newSocket.id];
          setCurrentPlayerSymbol(mySymbol);
          setMyTurn(mySymbol === "X");
        });

        newSocket.on("update_board", (moveData) => {
          const { row, col, player, selectedPlayer } = moveData;
          setGrid((prevGrid) => {
            const newGrid = prevGrid.map((r) => [...r]);
            newGrid[row][col] = { player: selectedPlayer, symbol: player };
            return newGrid;
          });

          if (player !== currentPlayerSymbol) {
            setMyTurn(true);
          }
        });

        newSocket.on("update_team_state", (newTeamSelections) => {
          setRowItems(newTeamSelections.rows);
          setColItems(newTeamSelections.cols);
        });

        newSocket.on("item_selected", ({ type, index, item }) => {
          if (type === "row") {
            setRowItems((prev) => {
              const updated = [...prev];
              updated[index] = item;
              return updated;
            });
          } else {
            setColItems((prev) => {
              const updated = [...prev];
              updated[index] = item;
              return updated;
            });
          }
        });

        newSocket.on("game_draw", () => {
          setGameOver(true);
          setWinner("draw");
        });

        newSocket.on("game_won", ({ winner }) => {
          setGameOver(true);
          setWinner(winner);
        });

        newSocket.on("opponent_disconnected", () => {
          setTimeout(() => {
            navigate("/game-online");
          }, 3000);
        });
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };

    fetchUserAndConnect();

    return () => {
      console.log("Disconnecting socket because page unmounted");
      if (newSocket) newSocket.disconnect();
    };
  }, [league, navigate]);

  if (!roomId) {
    return (
      <div className="searching-container">
        <h2 className="searching-text">Looking for an opponent...</h2>
        <div className="spinner"></div>
      </div>
    );
  }

  const handleTeamSelect = (type, index) => {
    if (currentPlayerSymbol !== teamSelectionTurn) {
      setErrorMessage("It's not your turn to pick a team/nationality!");
      return;
    }

    const currentItems = type === "row" ? rowItems : colItems;

    if (currentItems[index] !== null) {
      setErrorMessage("This position is already occupied!");
      return;
    }

    // Deschide modalul de selecție
    setModalType(type);
    setSelectedIndex(index);
    setShowTeamModal(true);
    setErrorMessage(null);
  };

  const handleCellClick = (row, col) => {
    if (!myTurn || grid[row][col].symbol !== null) {
      if (!myTurn) {
        setErrorMessage("Is not your turn!");
      } else {
        setErrorMessage("This cell is OCCUPIED!");
      }
      return;
    }

    const selectedPlayer = {
      nationality: rowItems[row],
      team: colItems[col],
    };

    const allRowsSelected = rowItems.every((item) => item !== null);
    const allColsSelected = colItems.every((item) => item !== null);

    if (!allRowsSelected || !allColsSelected) {
      setErrorMessage(
        "Please complete all team/nationality selections before playing!"
      );
      return;
    }

    socket.emit("make_move", {
      roomId,
      moveData: {
        row,
        col,
        player: currentPlayerSymbol,
        userId,
        selectedPlayer,
      },
    });

    setMyTurn(false);
  };

  const handleItemSelect = (type, index, item) => {
    if (currentPlayerSymbol !== teamSelectionTurn) {
      setErrorMessage("Is not your turn!");
      return;
    }

    // Verifică dacă item-ul a fost deja selectat
    const allItems = [...rowItems, ...colItems];
    const alreadyUsed = allItems.some(
      (existingItem, i) =>
        existingItem &&
        i !== index && // exclude poziția actuală
        existingItem.type === item.type &&
        existingItem.data.name === item.data.name
    );

    if (alreadyUsed) {
      setErrorMessage("This team or nationality was already selected!");
      return;
    }

    const updateFunc = type === "row" ? setRowItems : setColItems;
    updateFunc((prev) => [...prev.map((v, i) => (i === index ? item : v))]);

    socket.emit("select_item", { type, index, item });
    setErrorMessage(null);
  };

  const handleModalSelection = (item) => {
    handleItemSelect(modalType, selectedIndex, item);
    setShowTeamModal(false); // închide modalul după selecție
  };

  return (
    <div className="game-container">
      {gameOver && (
        <div className="game-over-container">
          <h2>
            {winner === userId
              ? "You won!"
              : winner === "draw"
              ? "It's a draw!"
              : "You lose!"}
          </h2>
          <p>
            {winner === "draw"
              ? "Nobody won this time."
              : "The game is over because your opponent has left or lost."}
          </p>
          <p>You will be redirected...</p>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-4">Game Page Online</h1>
      <p className="room-id">Room ID: {roomId}</p>

      <ErrorMessage
        message={errorMessage}
        onClose={() => setErrorMessage(null)}
      />

      <div className="tiki-taka-toe">
        <div className="header-row">
          <div className="logo-cell"></div>
          {colItems.map((item, colIndex) => (
            <div
              key={`col-${colIndex}`}
              className={`team-selector ${item ? "occupied" : ""}`}
              onClick={() => !item && handleTeamSelect("col", colIndex)}
            >
              {item ? (
                item.type === "team" ? (
                  <img
                    src={`/logos/${item.data.logo}`} // Folosește item aici
                    alt={item.data.name}
                    className="team-logo"
                  />
                ) : (
                  <Flag
                    code={item.data.flag}
                    style={{ width: "64px", height: "48px" }}
                    className="flag-icon"
                  />
                )
              ) : (
                <>
                  <div className="plus">+</div>
                  <div>ADD</div>
                </>
              )}
            </div>
          ))}
          <TeamModal
            isOpen={showTeamModal}
            onClose={() => setShowTeamModal(false)}
            items={allSelectableItems}
            onSelect={handleModalSelection}
          />
        </div>
        {grid.map((row, rowIndex) => (
          <div className="grid-row" key={`row-${rowIndex}`}>
            <div
              className={`team-selector ${
                rowItems[rowIndex] ? "occupied" : ""
              }`}
              onClick={() =>
                !rowItems[rowIndex] &&
                currentPlayerSymbol === teamSelectionTurn &&
                handleTeamSelect("row", rowIndex)
              }
            >
              {rowItems[rowIndex] ? (
                rowItems[rowIndex].type === "team" ? (
                  <img
                    src={`/logos/${rowItems[rowIndex].data.logo}`} // Folosește rowItems[rowIndex]
                    alt={rowItems[rowIndex].data.name}
                    className="team-logo"
                  />
                ) : (
                  <Flag
                    code={rowItems[rowIndex].data.flag}
                    style={{ width: "64px", height: "48px" }}
                    className="flag-icon"
                  />
                )
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
                className={`cell ${cell.symbol ? "occupied" : ""}`}
                onClick={() =>
                  !rowItems[rowIndex] && handleTeamSelect("row", rowIndex)
                }
              >
                {cell.symbol ? (
                  <span className="player-symbol">{cell.symbol}</span>
                ) : (
                  <span className="placeholder">+</span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default GamePageOnline;
