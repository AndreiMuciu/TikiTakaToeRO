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
import { debounce, set } from "lodash";
import MemoizedPlayerModal from "../components/same-screen-game/player-modal";
import Header from "../components/common/header";
import Footer from "../components/common/footer";
import BackButton from "../components/common/back-button";
import { useRef } from "react";

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

  const [playerModalState, setPlayerModalState] = useState({
    visible: false,
    players: [],
    query: "",
    cell: { row: null, col: null },
  });
  const [validPlayers, setValidPlayers] = useState([]);
  const playerSymbolRef = useRef(null);

  const allSelectableItems =
    league === "europe"
      ? [
          ...uefaCountries.map((nat) => ({
            type: "nationality",
            data: { name: nat.name, flag: nat.flag },
          })),
          ...teams.map((team) => ({
            type: "team",
            data: {
              _id: team._id, // Adaugă _id
              name: team.name,
              logo: team.logo,
            },
          })),
        ]
      : [
          ...SuperligaNationalities.map((nat) => ({
            type: "nationality",
            data: { name: nat.name, flag: nat.flag },
          })),
          ...teams.map((team) => ({
            type: "team",
            data: {
              _id: team._id, // Adaugă _id
              name: team.name,
              logo: team.logo,
            },
          })),
        ];

  const apiTeams = import.meta.env.VITE_TEAMS_API_URL;
  const apiPlayers = import.meta.env.VITE_PLAYERS_API_URL;

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
          transports: ["websocket"], // Forțează WebSocket
        });

        setSocket(newSocket);

        newSocket.on("update_team_turn", ({ nextTurn }) => {
          setTeamSelectionTurn(nextTurn);
        });

        newSocket.on("start_game", ({ roomId, symbols }) => {
          setRoomId(roomId);
          const mySymbol = symbols[newSocket.id];
          setCurrentPlayerSymbol(mySymbol);
          playerSymbolRef.current = mySymbol;
          setMyTurn(mySymbol === "X");
        });

        newSocket.on(
          "update_board",
          ({ row, col, player, selectedPlayer, nextTurn }) => {
            setGrid((prevGrid) => {
              const newGrid = prevGrid.map((r) => [...r]);
              newGrid[row][col] = { player: selectedPlayer, symbol: player };
              return newGrid;
            });

            setMyTurn(playerSymbolRef.current === nextTurn); // <- folosește ref aici
          }
        );

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
          setTimeout(() => {
            navigate("/game-online");
          }, 3000);
        });

        newSocket.on("game_won", ({ winner }) => {
          setTimeout(() => {}, 200);

          setGameOver(true);
          setWinner(winner);

          setTimeout(() => {
            navigate("/game-online");
          }, 3000);
        });

        newSocket.on("opponent_disconnected", () => {
          setGameOver(true);
          setWinner(userId);
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
        <h2 className="searching-text">Looking for an Opponent</h2>
        <p className="searching-subtext">
          Searching {league ? `in ${league.toUpperCase()} league` : ""}...
          Please wait while we find you a worthy challenger!
        </p>

        <div className="soccer-loader">
          <div className="soccer-ball">
            <img src="/ball.png" alt="Soccer ball" />
          </div>
        </div>

        <div className="connecting-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>

        <button
          className="cancel-button"
          onClick={() => {
            if (socket) socket.disconnect();
            navigate(-1);
          }}
        >
          Cancel Search
        </button>
      </div>
    );
  }

  const getPlayersByTeamAndNationality = async (teamId, nationality) => {
    try {
      const response = await axios.get(
        `${apiPlayers}played-for-team-and-nationality`,
        {
          params: { team1: teamId, nationality },
        }
      );
      return response.data.data.players;
    } catch (error) {
      console.error("Error fetching players:", error);
      return [];
    }
  };

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

  const handleCellClick = async (row, col) => {
    if (gameOver) {
      setErrorMessage("Game over! You can't make a move.");
      return;
    }
    if (!myTurn) {
      setErrorMessage("Nu e rândul tău!");
      return;
    }
    if (grid[row][col].symbol !== null) {
      setErrorMessage("Celula este ocupată!");
      return;
    }

    const rowItem = rowItems[row];
    const colItem = colItems[col];

    if (!rowItem || !colItem) {
      setErrorMessage("Selectează criteriile mai întâi!");
      return;
    }

    try {
      let players = [];
      if (rowItem.type === "team" && colItem.type === "team") {
        players = await getValidPlayers(rowItem.data._id, colItem.data._id);
      } else if (
        (rowItem.type === "team" && colItem.type === "nationality") ||
        (rowItem.type === "nationality" && colItem.type === "team")
      ) {
        const teamId =
          rowItem.type === "team" ? rowItem.data._id : colItem.data._id;
        const nationality =
          rowItem.type === "nationality"
            ? rowItem.data.name
            : colItem.data.name;
        players = await getPlayersByTeamAndNationality(teamId, nationality);
      }

      if (players.length === 0) {
        setErrorMessage("Niciun jucător disponibil pentru această combinație!");
        return;
      }

      console.log("Players found:", players);

      setValidPlayers(players);
      setPlayerModalState({
        visible: true,
        players: [], // Afișează imediat jucătorii găsiți
        query: "",
        cell: { row, col },
      });
    } catch (error) {
      setErrorMessage("Eroare la încărcarea jucătorilor");
    }
  };

  const handlePlayerSelection = (selectedPlayer) => {
    const { row, col } = playerModalState.cell;
    const isValid = validPlayers.some((p) => p._id === selectedPlayer._id);

    if (!isValid) {
      setErrorMessage("Jucător invalid pentru combinația selectată!");
      return;
    }

    socket.emit("make_move", {
      row,
      col,
      player: currentPlayerSymbol,
      selectedPlayer,
    });

    setPlayerModalState({ ...playerModalState, visible: false });
    setMyTurn(false);
  };

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

  const handleItemSelect = (type, index, item) => {
    if (currentPlayerSymbol !== teamSelectionTurn) {
      setErrorMessage("It's not your turn to pick a team/nationality!");
      return;
    }

    const currentItems = type === "row" ? rowItems : colItems;
    if (currentItems[index] !== null) {
      setErrorMessage("This slot is already taken.");
      return;
    }

    const otherItems = type === "row" ? colItems : rowItems;
    const otherHasNationality = otherItems.some(
      (i) => i && i.type === "nationality"
    );

    if (item.type === "nationality" && otherHasNationality) {
      setErrorMessage(
        "You can't select a nationality here because the other side already has one!"
      );
      return;
    }

    const otherSideConflict =
      item.type === "nationality" && otherHasNationality;

    if (otherSideConflict) {
      setErrorMessage(
        "You can only have nationalities on one axis (rows or columns)!"
      );
      return;
    }

    const isDuplicate = [...rowItems, ...colItems].some(
      (existingItem) =>
        existingItem &&
        existingItem.type === item.type &&
        existingItem.data.name === item.data.name
    );

    if (isDuplicate) {
      setErrorMessage("This item was already selected!");
      return;
    }

    const updateFunc = type === "row" ? setRowItems : setColItems;
    updateFunc((prev) => {
      const updated = [...prev];
      updated[index] = item;
      return updated;
    });

    socket.emit("select_item", { type, index, item });
    setErrorMessage(null);
  };

  const handleModalSelection = (item) => {
    handleItemSelect(modalType, selectedIndex, item);
    setShowTeamModal(false); // închide modalul după selecție
  };

  const debouncedSearch = debounce(async (query) => {
    try {
      // Verificăm dacă query-ul are minim 2 caractere
      if (query.length < 2) {
        setPlayerModalState((prev) => ({
          ...prev,
          players: [],
          query: query,
        }));
        return;
      }

      const response = await axios.get(`${apiPlayers}search`, {
        params: { q: query },
      });
      setPlayerModalState((prev) => ({
        ...prev,
        players: response.data.data.players,
      }));
    } catch (error) {
      console.error("Căutare eșuată:", error);
    }
  }, 300);

  return (
    <>
      <Header />
      <ErrorMessage
        message={errorMessage}
        onClose={() => setErrorMessage(null)}
      />
      {gameOver && (
        <div className="game-over-container">
          <h2>
            {winner === userId
              ? "You won!"
              : winner === "draw"
              ? "It's a draw!"
              : "You lost!"}
          </h2>
          <p>
            {winner === "draw" ? "Nobody won this time." : "The game is over!"}
          </p>
          <p>You will be redirected...</p>
        </div>
      )}

      {
        //<h1 className="text-3xl font-bold mb-4">Game Page Online</h1>
        //<p className="room-id">Room ID: {roomId}</p>
      }
      <div className="page-wrapper">
        <BackButton
          text="Back to Leagues"
          navigateTo="/game-online"
          className="back-button-x"
        />

        <TeamModal
          isOpen={showTeamModal}
          onClose={() => setShowTeamModal(false)}
          items={allSelectableItems}
          onSelect={handleModalSelection}
        />

        <MemoizedPlayerModal
          show={playerModalState.visible}
          players={playerModalState.players}
          onClose={() =>
            setPlayerModalState({ ...playerModalState, visible: false })
          }
          onSearch={(query) => {
            setPlayerModalState((prev) => ({ ...prev, query }));
            debouncedSearch(query);
          }}
          onSelect={handlePlayerSelection}
          validPlayers={validPlayers}
          query={playerModalState.query}
        />

        <div className="tiki-taka-toe">
          <div className="header-row">
            <div className="logo-cell"></div>
            {colItems.map((item, colIndex) => (
              <div
                key={`col-${colIndex}`}
                className={`team-selector ${item ? "occupied" : ""}`}
                onClick={() =>
                  !colItems[colIndex] && handleTeamSelect("col", colIndex)
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
          </div>
          {grid.map((row, rowIndex) => (
            <div className="grid-row" key={`row-${rowIndex}`}>
              <div
                className={`team-selector ${
                  rowItems[rowIndex] ? "occupied" : ""
                }`}
                onClick={() =>
                  !rowItems[rowIndex] && handleTeamSelect("row", rowIndex)
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
      <Footer />
    </>
  );
}

export default GamePageOnline;
