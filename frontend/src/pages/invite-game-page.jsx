import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import Header from "../components/common/header";
import Footer from "../components/common/footer";
import BackButton from "../components/common/back-button";
import ErrorMessage from "../components/common/error-message";
import TeamModal from "../components/online-game/team-modal";
import MemoizedPlayerModal from "../components/same-screen-game/player-modal";
import Flag from "react-world-flags";
import { debounce } from "lodash";
import {
  uefaCountries,
  SuperligaNationalities,
  europeanTopTeamIds,
} from "../dataStuff";
import "../styles/components/game-online.css";

const socketServerUrl =
  import.meta.env.VITE_INVITE_SOCKET_SERVER_URL ||
  import.meta.env.VITE_SOCKET_SERVER_URL;
const apiUserUrl = import.meta.env.VITE_USERS_API_URL;
const apiTeams = import.meta.env.VITE_TEAMS_API_URL;
const apiPlayers = import.meta.env.VITE_PLAYERS_API_URL;

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

export default function InviteGamePage() {
  const { league } = useParams();
  const query = useQuery();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState(query.get("room") || null);
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
  const [drawOfferPending, setDrawOfferPending] = useState(false);
  const [showDrawOffer, setShowDrawOffer] = useState(false);
  const [turnTimer, setTurnTimer] = useState(30);
  const timerRef = useRef(null);
  const [currentRuleIndex, setCurrentRuleIndex] = useState(0);

  const allSelectableItems =
    league === "europe"
      ? [
          ...uefaCountries.map((nat) => ({
            type: "nationality",
            data: { name: nat.name, flag: nat.flag },
          })),
          ...teams.map((team) => ({
            type: "team",
            data: { _id: team._id, name: team.name, logo: team.logo },
          })),
        ]
      : [
          ...SuperligaNationalities.map((nat) => ({
            type: "nationality",
            data: { name: nat.name, flag: nat.flag },
          })),
          ...teams.map((team) => ({
            type: "team",
            data: { _id: team._id, name: team.name, logo: team.logo },
          })),
        ];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && showTeamModal) setShowTeamModal(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showTeamModal]);

  useEffect(() => {
    if (!myTurn || gameOver) {
      clearInterval(timerRef.current);
      setTurnTimer(30);
      return;
    }
    setTurnTimer(30);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTurnTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (socket && myTurn && !gameOver) socket.emit("turn_timeout");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [myTurn, gameOver]);

  useEffect(() => {
    const loadTeams = async () => {
      try {
        if (league === "europe") {
          const res = await axios.get(`${apiTeams}by-ids`, {
            params: { ids: europeanTopTeamIds.join(",") },
          });
          setTeams(res.data.data.teams);
        } else {
          const res = await axios.get(
            `${apiTeams}?country=${league}&sort=name`
          );
          setTeams(res.data.data.data);
        }
      } catch (e) {
        setTeams([]);
      }
    };
    loadTeams();
  }, [league]);

  useEffect(() => {
    let newSocket;
    const connect = async () => {
      try {
        const res = await axios.get(`${apiUserUrl}me`, {
          withCredentials: true,
        });
        const uid = res.data.data.user._id;
        setUserId(uid);

        newSocket = io(socketServerUrl, {
          withCredentials: true,
          query: {
            leagueId: league,
            userId: uid,
            mode: "invite",
            roomId: roomId || undefined,
          },
          transports: ["websocket"],
        });
        setSocket(newSocket);

        newSocket.on(
          "start_game",
          ({ roomId: id, symbols, initialTeamTurn, initialSelections }) => {
            setRoomId(id);
            const mySymbol = symbols[newSocket.id];
            setCurrentPlayerSymbol(mySymbol);
            playerSymbolRef.current = mySymbol;
            setMyTurn(mySymbol === (initialTeamTurn || "X"));
            if (initialSelections) {
              setRowItems(initialSelections.rows);
              setColItems(initialSelections.cols);
            }
          }
        );

        newSocket.on("update_team_turn", ({ nextTurn }) => {
          setTeamSelectionTurn(nextTurn);
          setMyTurn(playerSymbolRef.current === nextTurn);
        });

        newSocket.on("update_team_state", (newTeamSelections) => {
          setRowItems(newTeamSelections.rows);
          setColItems(newTeamSelections.cols);
        });

        newSocket.on("update_board", (data) => {
          if (data.row !== undefined && data.col !== undefined) {
            const { row, col, player, selectedPlayer } = data;
            setGrid((prev) => {
              const copy = prev.map((r) => [...r]);
              copy[row][col] = { player: selectedPlayer, symbol: player };
              return copy;
            });
          }
          if (typeof data.nextTurn !== "undefined") {
            setMyTurn(playerSymbolRef.current === data.nextTurn);
          }
        });

        newSocket.on("draw_offered", () => {
          setShowDrawOffer(true);
        });
        newSocket.on("draw_accepted", () => {
          setGameOver(true);
          setWinner("draw");
          setTimeout(() => navigate("/invite-create"), 5000);
        });
        newSocket.on("draw_declined", () => {
          setErrorMessage("Your draw offer was declined");
          setDrawOfferPending(false);
        });

        newSocket.on("game_draw", () => {
          setGameOver(true);
          setWinner("draw");
          setTimeout(() => navigate("/invite-create"), 5000);
        });
        newSocket.on("game_won", ({ winner }) => {
          setGameOver(true);
          setWinner(winner);
          setTimeout(() => navigate("/invite-create"), 5000);
        });
        newSocket.on("opponent_disconnected", () => {
          setGameOver(true);
          setWinner(uid);
          setTimeout(() => navigate("/invite-create"), 5000);
        });

        newSocket.on("invite_invalid", ({ reason }) => {
          const messages = {
            not_found: "This invite link is no longer valid.",
            expired:
              "This invite has expired. Please ask your friend to create a new one.",
            creator_not_waiting:
              "The game creator is no longer waiting. Ask them to recreate the invite.",
            self_join: "You can't use your own invite link.",
            already_started: "This game already started without you.",
            wrong_league: "This invite is for a different league.",
          };
          setErrorMessage(messages[reason] || "Invalid invite.");
          setTimeout(() => navigate("/invite-create"), 3000);
        });

        // Join or create private room if roomId present from link
        if (roomId) {
          newSocket.emit("join_private_room", { roomId, league, userId: uid });
        }
      } catch (e) {
        setErrorMessage("Authentication required");
      }
    };
    connect();
    return () => newSocket && newSocket.disconnect();
  }, [league]);

  useEffect(() => {
    let interval;
    if (!roomId) {
      interval = setInterval(() => {
        setCurrentRuleIndex((prev) => (prev + 1) % (teams.length || 1));
      }, 10000);
    }
    return () => clearInterval(interval);
  }, [roomId, teams.length]);

  const goToRule = (index) => setCurrentRuleIndex(index);

  if (!roomId) {
    return (
      <>
        <Header />
        <div className="searching-container">
          <div className="team-card-container">
            {teams.map((team, index) => {
              const country = uefaCountries.find(
                (nat) => nat.name === team.country
              );
              return (
                <div
                  key={index}
                  className={`team-card ${
                    index === currentRuleIndex ? "active" : ""
                  }`}
                >
                  <div className="team-number">
                    <img
                      src={`/logos/${team.logo}`}
                      alt={`Team ${team.name}`}
                    />
                    <Flag code={country?.flag} className="team-flag" />
                  </div>
                  <div className="team-content">
                    <h3>{team.name}</h3>
                    <p>{team.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="team-progress-container">
            <div
              className="team-progress-bar"
              style={{
                width: `${
                  (currentRuleIndex + 1) * (100 / (teams.length || 1))
                }%`,
              }}
            />
          </div>
          <div className="team-indicators">
            {teams.map((_, index) => (
              <button
                key={index}
                className={`indicator ${
                  index === currentRuleIndex ? "active" : ""
                }`}
                onClick={() => goToRule(index)}
              />
            ))}
          </div>
          <div className="loading-status">
            <div className="loading-spinner"></div>
            <p>Waiting for your friend to join via invite link...</p>
          </div>
          <button className="cancel-button" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
        <Footer />
      </>
    );
  }

  const handleOfferDraw = () => {
    if (!socket || !myTurn || gameOver) return;
    setDrawOfferPending(true);
    socket.emit("offer_draw");
    setMyTurn(false);
  };
  const handleDrawResponse = (accepted) => {
    setShowDrawOffer(false);
    socket.emit("respond_draw", { accepted });
    if (!accepted) {
      setDrawOfferPending(false);
      setMyTurn(true);
    }
  };

  const getPlayersByTeamAndNationality = async (teamId, nationality) => {
    try {
      const response = await axios.get(
        `${apiPlayers}played-for-team-and-nationality`,
        {
          params: { team1: teamId, nationality },
        }
      );
      return response.data.data.players;
    } catch (e) {
      return [];
    }
  };
  const getValidPlayers = async (team1, team2) => {
    try {
      const response = await axios.get(`${apiPlayers}played-for-two-teams`, {
        params: { team1, team2 },
      });
      return response.data.data.players;
    } catch (e) {
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
    setModalType(type);
    setSelectedIndex(index);
    setShowTeamModal(true);
    setErrorMessage(null);
  };

  const handleCellClick = async (row, col) => {
    if (gameOver) return setErrorMessage("Game over! You can't make a move.");
    if (!myTurn) return setErrorMessage("Is not your turn!");
    if (grid[row][col].symbol !== null)
      return setErrorMessage("The cell is occupied!");
    if (!rowItems.every((i) => i) || !colItems.every((i) => i))
      return setErrorMessage("Complete all rows and columns first!");

    const rowItem = rowItems[row];
    const colItem = colItems[col];
    if (!rowItem || !colItem)
      return setErrorMessage("Select the teams/nationalities first!");

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
      if (players.length === 0)
        return setErrorMessage("No player availaible for this combination!");
      setValidPlayers(players);
      setPlayerModalState({
        visible: true,
        players: [],
        query: "",
        cell: { row, col },
      });
    } catch (e) {
      setErrorMessage("Failed loading players");
    }
  };

  const handlePlayerSelection = (selectedPlayer) => {
    const { row, col } = playerModalState.cell;
    const isValid = validPlayers.some((p) => p._id === selectedPlayer._id);
    if (!isValid) {
      setErrorMessage("Invalid player for selected combination!");
      socket.emit("invalid_move");
      setMyTurn(false);
      setPlayerModalState({ ...playerModalState, visible: false });
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

  const handleItemSelect = (type, index, item) => {
    if (currentPlayerSymbol !== teamSelectionTurn)
      return setErrorMessage("It's not your turn to pick a team/nationality!");
    const currentItems = type === "row" ? rowItems : colItems;
    if (currentItems[index] !== null)
      return setErrorMessage("This slot is already taken.");
    const otherItems = type === "row" ? colItems : rowItems;
    const otherHasNationality = otherItems.some(
      (i) => i && i.type === "nationality"
    );
    if (item.type === "nationality" && otherHasNationality)
      return setErrorMessage(
        "You can only have nationalities on one axis (rows or columns)!"
      );
    const isDuplicate = [...rowItems, ...colItems].some(
      (existingItem) =>
        existingItem &&
        existingItem.type === item.type &&
        existingItem.data.name === item.data.name
    );
    if (isDuplicate) return setErrorMessage("This item was already selected!");
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
    setShowTeamModal(false);
  };

  const debouncedSearch = debounce(async (query) => {
    try {
      const response = await axios.get(`${apiPlayers}search`, {
        params: { q: query },
      });
      setPlayerModalState((prev) => ({
        ...prev,
        players: response.data.data.players,
      }));
    } catch (e) {}
  }, 300);

  const handleSkipTurn = () => {
    if (!myTurn || gameOver) return;
    if (rowItems.every((i) => i) && colItems.every((i) => i))
      socket.emit("skip_turn", { phase: "game" });
    else socket.emit("skip_turn", { phase: "team_selection" });
  };

  return (
    <>
      <Header />
      <ErrorMessage
        message={errorMessage}
        onClose={() => setErrorMessage(null)}
      />
      {gameOver && (
        <div
          className={`game-over-container ${
            winner === userId
              ? "victory"
              : winner === "draw"
              ? "draw"
              : "defeat"
          }`}
        >
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
      {showDrawOffer && (
        <div className="draw-offer-modal">
          <div className="draw-offer-content">
            <p>Your opponent offers a draw.</p>
            <div className="draw-buttons">
              <button onClick={() => handleDrawResponse(true)}>Accept</button>
              <button onClick={() => handleDrawResponse(false)}>Decline</button>
            </div>
          </div>
        </div>
      )}
      <div className="page-wrapper">
        <BackButton
          text="Back to Leagues"
          navigateTo="/invite-create"
          className="back-button-x"
        />
        {myTurn && <div className="turn-timer">⏰ {turnTimer}s</div>}
        <div className="turn-indicator">
          {!gameOver && (
            <div className="turn-status">
              <div className="turn-controls-inline">
                {myTurn &&
                  rowItems.every((i) => i) &&
                  colItems.every((i) => i) &&
                  !drawOfferPending && (
                    <button
                      className="draw-button"
                      onClick={handleOfferDraw}
                      disabled={!myTurn || gameOver}
                    >
                      Offer Draw
                    </button>
                  )}
                {rowItems.every((i) => i) && colItems.every((i) => i) ? (
                  <>
                    <div className="turn-info">
                      <span className="turn-label">
                        {myTurn ? "Your turn" : "Opponent's turn"}
                      </span>
                      <span className={`turn-symbol ${currentPlayerSymbol}`}>
                        {currentPlayerSymbol}
                      </span>
                    </div>
                    {myTurn && (
                      <button
                        className="skip-button"
                        onClick={handleSkipTurn}
                        disabled={!myTurn}
                      >
                        Skip Turn
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <div className="turn-info">
                      <span className="turn-label">
                        {teamSelectionTurn === currentPlayerSymbol
                          ? "Your turn to select teams"
                          : "Opponent is selecting teams"}
                      </span>
                    </div>
                    {teamSelectionTurn === currentPlayerSymbol && (
                      <button className="skip-button" onClick={handleSkipTurn}>
                        Skip Selection
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

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
            if (query.length >= 2) debouncedSearch(query);
            else setPlayerModalState((prev) => ({ ...prev, players: [] }));
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
                      src={`/logos/${item.data.logo}`}
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
                      src={`/logos/${rowItems[rowIndex].data.logo}`}
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
