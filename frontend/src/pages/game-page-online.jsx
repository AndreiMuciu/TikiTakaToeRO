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
import TeamModalOnline from "../components/online-game/team-modal-online";
import ErrorMessage from "../components/common/error-message";

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

  const nationalities =
    league === "europe" ? uefaCountries : SuperligaNationalities;

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

        newSocket.on("update_team_turn", ({ nextTurn }) => {
          setTeamSelectionTurn(nextTurn);
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
    const currentItems = type === "row" ? rowItems : colItems;
    if (currentItems[index] !== null) {
      setErrorMessage("This position is already occupied!");
      return;
    }

    // Verificare dacă este rândul tău să alegi echipă
    if (currentPlayerSymbol !== teamSelectionTurn) {
      setErrorMessage("It's not your turn to pick a team/nationality!");
      return;
    }

    setModalType(type);
    setSelectedIndex(index);
    setShowTeamModal(true);
  };

  const handleCellClick = (row, col) => {
    if (!myTurn || grid[row][col].symbol !== null) return;

    const selectedPlayer = {
      nationality: rowItems[row],
      team: colItems[col],
    };

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
      setErrorMessage("Not your turn to select!");
      return;
    }

    const updateFunc = type === "row" ? setRowItems : setColItems;

    updateFunc((prev) => {
      const updated = [...prev];
      updated[index] = item;
      return updated;
    });

    socket.emit("select_item", {
      type,
      index,
      item,
    });

    // Schimbă rândul pentru alegere
    setTeamSelectionTurn((prev) => (prev === "X" ? "O" : "X"));
    socket.emit("update_team_turn", {
      nextTurn: teamSelectionTurn === "X" ? "O" : "X",
    });
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

      <div className="tiki-taka-toe">
        {showTeamModal && (
          <TeamModalOnline
            type={modalType}
            onClose={() => setShowTeamModal(false)}
            onSelect={(item) => {
              handleItemSelect(modalType, selectedIndex, item);
              setShowTeamModal(false);
            }}
            nationalities={nationalities}
            league={league}
          />
        )}
        // Schimbă rowItems[rowIndex] cu item
        <div className="header-row">
          <div className="logo-cell"></div>
          {colItems.map((item, colIndex) => (
            <div
              key={`col-${colIndex}`}
              className={`team-selector ${item ? "occupied" : ""}`}
              onClick={() =>
                !item && myTurn && handleTeamSelect("col", colIndex)
              }
            >
              {item ? (
                item.type === "team" ? (
                  <img
                    src={`/logos/${item.data.logo}`} // Folosește item aici
                    alt={item.data.name}
                    className="team-logo"
                  />
                ) : (
                  <img
                    src={`https://flagsapi.com/${item.data.flag}/flat/64.png`} // Folosește item aici
                    alt={item.data.name}
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
        </div>
        {grid.map((row, rowIndex) => (
          <div className="grid-row" key={`row-${rowIndex}`}>
            <div
              className={`team-selector ${
                rowItems[rowIndex] ? "occupied" : ""
              }`}
              onClick={() =>
                !rowItems[rowIndex] &&
                myTurn &&
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
                  <img
                    src={`https://flagsapi.com/${rowItems[rowIndex].data.flag}/flat/64.png`} // Folosește rowItems[rowIndex]
                    alt={rowItems[rowIndex].data.name}
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
                onClick={() => handleCellClick(rowIndex, colIndex)}
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
