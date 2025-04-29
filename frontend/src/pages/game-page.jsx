import { useState, useEffect } from "react";
import "../styles/components/game.css"; // Import your CSS file for styling
import Header from "../components/header";
import Footer from "../components/footer";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import MemoizedPlayerModal from "../components/player-modal"; // Numele corect
import { debounce, set } from "lodash";
import Flag from "react-world-flags";
import ErrorMessage from "../components/error-message";

const GamePage = () => {
  // Ștergem stările redundante
  // const [showPlayerModal, setShowPlayerModal] = useState(false); - Șters
  // const [selectedCell, setSelectedCell] = useState({ row: null, col: null }); - Șters
  // const [playersList, setPlayersList] = useState([]); - Șters
  // const [searchQuery, setSearchQuery] = useState(""); - Șters

  const [errorMessage, setErrorMessage] = useState(null);

  const [rowItems, setRowItems] = useState([null, null, null]);
  const [colItems, setColItems] = useState([null, null, null]);

  const [showTeamModal, setShowTeamModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [teams, setTeams] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState("X");
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const navigate = useNavigate();
  const [grid, setGrid] = useState(
    Array(3)
      .fill(null)
      .map(() =>
        Array(3)
          .fill(null)
          .map(() => ({ player: null, symbol: null }))
      )
  );
  const [validPlayers, setValidPlayers] = useState([]); // Adăugăm starea pentru jucători valizi

  const [playerModalState, setPlayerModalState] = useState({
    visible: false,
    players: [],
    query: "",
    cell: { row: null, col: null },
  });

  const apiTeams = import.meta.env.VITE_TEAMS_API_URL;
  const apiPlayers = import.meta.env.VITE_PLAYERS_API_URL;
  const { league } = useParams();

  const uefaCountries = [
    {
      name: "romania",
      flag: "ro",
    },
    {
      name: "spain",
      flag: "es",
    },
    {
      name: "france",
      flag: "fr",
    },
    {
      name: "portugal",
      flag: "pt",
    },
    {
      name: "germany",
      flag: "de",
    },
    {
      name: "italy",
      flag: "it",
    },
    {
      name: "belgium",
      flag: "be",
    },
    {
      name: "netherlands",
      flag: "nl",
    },
    {
      name: "ukraine",
      flag: "ua",
    },
    {
      name: "poland",
      flag: "pl",
    },
    {
      name: "england",
      flag: "gb",
    },
    {
      name: "georgia",
      flag: "ge",
    },
    {
      name: "denmark",
      flag: "dk",
    },
    {
      name: "slovenia",
      flag: "si",
    },
    {
      name: "switzerland",
      flag: "ch",
    },
    {
      name: "austria",
      flag: "at",
    },
    {
      name: "turkey",
      flag: "tr",
    },
    {
      name: "slovakia",
      flag: "sk",
    },
    {
      name: "USA",
      flag: "us",
    },
    {
      name: "argentina",
      flag: "ar",
    },
    {
      name: "australia",
      flag: "au",
    },
    {
      name: "brazil",
      flag: "br",
    },
    {
      name: "japan",
      flag: "jp",
    },
    {
      name: "south korea",
      flag: "kr",
    },
    {
      name: "croatia",
      flag: "hr",
    },
    {
      name: "senegal",
      flag: "sn",
    },
    {
      name: "morocco",
      flag: "ma",
    },
  ];

  const SuperligaNationalities = [
    {
      name: "romania",
      flag: "ro",
    },
    {
      name: "spain",
      flag: "es",
    },
    {
      name: "france",
      flag: "fr",
    },
    {
      name: "portugal",
      flag: "pt",
    },
    {
      name: "camoeroon",
      flag: "cm",
    },
    /*{
      name: "belgium",
      flag: "be",
    },*/
    {
      name: "moldova",
      flag: "md",
    },
    /*{
      name: "kosovo",
      flag: "xk",
    },*/
    /*{
      name: "serbia",
      flag: "rs",
    },*/
    {
      name: "bulgaria",
      flag: "bg",
    },
    {
      name: "croatia",
      flag: "hr",
    },
    {
      name: "bosnia",
      flag: "ba",
    },
    {
      name: "brazil",
      flag: "br",
    },
    {
      name: "nigeria",
      flag: "ng",
    },
    /*{
      name: "ivory coast",
      flag: "ci",
    },*/
  ];

  const nationalities =
    league === "europe" ? uefaCountries : SuperligaNationalities;

  const europeanTopTeamIds = [
    "6807942dc7c8518cb429f33f", // Real Madrid
    "6808ce0a270ea05e913083b2", // Bilbao
    "680684e78af6be19106fa0c1", // Sevilla
    "680c2228e55539e187c8cba0", // Barcelona
    "680c2255e55539e187c8cba2", // Atlético Madrid

    "6808d6ef270ea05e913083fd", // PSG
    "680688278af6be19106fa0d9", // Marseille
    "680688178af6be19106fa0d7", // Lyon

    "6807879cc7c8518cb429f2ea", // Lazio
    "6803eba88661194cabace7ea", // AS Roma
    "6803e87f8661194cabace7cf", // Napoli
    "6803df778661194cabace793", // Bologna
    "6803df1f8661194cabace791", // Inter Milan
    "680c2eb0e55539e187c8cbe6", // Juventus
    "680c2eefe55539e187c8cbe8", // AC Milan

    "680c23eae55539e187c8cbb6", // Bayern Munchen
    "680c240be55539e187c8cbb8", // Borussia Dortmund
    "680c2427e55539e187c8cbba", // Bayer Leverkusen
    "680c244be55539e187c8cbbc", // RB Leipzig

    "68068d188af6be19106fa101", // FC Porto
    "680c23a1e55539e187c8cbb2", // Benfica
    "680c23bae55539e187c8cbb4", // Sporting CP

    "6806850c8af6be19106fa0c3", // Aston Villa
    "6803e89c8661194cabace7d1", // Tottenham
    "680c2293e55539e187c8cba4", // Liverpool
    "680c22aee55539e187c8cba6", // Arsenal
    "680c22cee55539e187c8cba8", // Manchester City
    "680c22eae55539e187c8cbaa", // Manchester United
    "680c2317e55539e187c8cbac", // Chelsea

    "6804ceffa24f092f8f326e50", // RSC Anderlecht

    "680c2475e55539e187c8cbbe", // Ajax

    "6804c7caa24f092f8f326e1b", // Galatasaray
    "680c2339e55539e187c8cbae", // Beşiktaş
    "6803dfad8661194cabace795", // Kayserispor
    "680c2363e55539e187c8cbb0", // Fenerbahçe

    "67fe378e425f76ea1a75ac69", // FCSB
    "67fe37c1425f76ea1a75ac6e", // Dinamo București
    "67fe37d1425f76ea1a75ac70", // CFR Cluj
    "67fe3811425f76ea1a75ac76", // Universitatea Craiova
  ];

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
    const loadTeams = async () => {
      const loadedTeams = await getTeams();
      setTeams(loadedTeams);
    };
    loadTeams();
  }, []);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && showTeamModal) {
        setShowTeamModal(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showTeamModal]);
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
    const currentItems = type === "row" ? rowItems : colItems;
    if (currentItems[index] !== null) {
      setErrorMessage("This position is already occupied!");
      return;
    }

    setModalType(type);
    setSelectedIndex(index);
    setShowTeamModal(true);
  };

  const handleItemSelection = (selectedItem, isNationality = false) => {
    const isRow = modalType === "row";
    const itemsArray = isRow ? rowItems : colItems;
    const otherItems = isRow ? colItems : rowItems;
    const setItems = isRow ? setRowItems : setColItems;

    const newItem = {
      type: isNationality ? "nationality" : "team",
      data: selectedItem,
    };

    // Verificare existență în ambele direcții
    const existsInAnyAxis = [...rowItems, ...colItems].some((item) => {
      if (!item) return false;
      return (
        item.type === newItem.type &&
        ((item.type === "team" && item.data._id === newItem.data._id) ||
          (item.type === "nationality" && item.data.name === newItem.data.name))
      );
    });

    if (existsInAnyAxis) {
      setErrorMessage("This item is already selected!");
      return;
    }

    // 💡 REGULĂ: dacă adaugi o naționalitate pe o linie, nu mai poți adăuga naționalități pe coloane și invers
    const otherHasNationality = otherItems.some(
      (item) => item?.type === "nationality"
    );

    if (isNationality && otherHasNationality) {
      setErrorMessage(
        "You can only add nationalities on either rows or columns, not both!"
      );
      return;
    }

    const thisHasNationality = itemsArray.some(
      (item) => item?.type === "nationality"
    );

    if (isNationality && thisHasNationality) {
      const sameExists = itemsArray.some(
        (item) =>
          item?.type === "nationality" && item.data.name === newItem.data.name
      );
      if (sameExists) {
        setErrorMessage("This nationality is already selected!");
        return;
      }
    }

    const newItems = [...itemsArray];
    newItems[selectedIndex] = newItem;
    setItems(newItems);

    setShowTeamModal(false);
  };

  const debouncedSearch = debounce(async (query) => {
    if (query.length < 2) return;

    try {
      const response = await axios.get(`${apiPlayers}search?sort=name`, {
        params: { q: query },
      });
      console.log(response);
      setPlayerModalState((prev) => ({
        ...prev,
        players: response.data.data.players,
      }));
    } catch (error) {
      console.error("Error searching players:", error);
    }
  }, 300);

  const handlePlayerSelect = async (row, col) => {
    if (gameOver) return setErrorMessage("The game is over!");

    if (grid[row][col].symbol !== null) {
      return setErrorMessage("This cell is already occupied!");
    }

    const rowItem = rowItems[row];
    const colItem = colItems[col];
    if (!rowItem || !colItem)
      return setErrorMessage("Select Teams/nationalities!");

    let players = [];

    try {
      if (rowItem.type === "team" && colItem.type === "team") {
        players = await getValidPlayers(rowItem.data._id, colItem.data._id);
      } else if (
        (rowItem.type === "team" && colItem.type === "nationality") ||
        (rowItem.type === "nationality" && colItem.type === "team")
      ) {
        const team =
          rowItem.type === "team" ? rowItem.data._id : colItem.data._id;
        const nationality =
          rowItem.type === "nationality"
            ? rowItem.data.name
            : colItem.data.name;

        console.log("team", team);
        console.log("nationality", nationality);
        players = await getPlayersByTeamAndNationality(team, nationality);
      } else {
        setErrorMessage("Select a team and a nationality!");
        return;
      }

      setValidPlayers(players);

      setPlayerModalState({
        visible: true,
        players: [],
        query: "",
        cell: { row, col },
      });
    } catch (error) {
      console.error("Eroare la încărcarea jucătorilor", error);
      setErrorMessage("Eroare la încărcarea jucătorilor!");
    }
  };

  const getPlayersByTeamAndNationality = async (teamId, nationality) => {
    try {
      const response = await axios.get(
        `${apiPlayers}played-for-team-and-nationality`,
        {
          params: {
            team1: teamId,
            nationality, // ex: "romania"
          },
        }
      );
      console.log(response);
      return response.data.data.players;
    } catch (error) {
      console.error("Error fetching players by nationality:", error);
      return [];
    }
  };

  const handlePlayerSearch = (query) => {
    setPlayerModalState((prev) => ({ ...prev, query }));
    debouncedSearch(query);
  };

  const handlePlayerSelection = (selectedPlayer) => {
    const {
      cell: { row, col },
    } = playerModalState;

    const isValid = validPlayers.some((p) => p._id === selectedPlayer._id);

    if (!isValid) {
      setCurrentPlayer((prev) => (prev === "X" ? "O" : "X"));
      setPlayerModalState((prev) => ({ ...prev, visible: false }));
      return;
    }

    const newGrid = [...grid];
    newGrid[row][col] = {
      player: selectedPlayer,
      symbol: currentPlayer,
    };

    setGrid(newGrid);
    setPlayerModalState((prev) => ({ ...prev, visible: false }));

    const winnerResult = checkForWinner(newGrid);
    if (winnerResult) {
      setGameOver(true);
      setWinner(winnerResult === "draw" ? "draw" : winnerResult);
    } else {
      setCurrentPlayer((prev) => (prev === "X" ? "O" : "X"));
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
    setRowItems([null, null, null]);
    setColItems([null, null, null]);
    setCurrentPlayer("X");
    setGameOver(false);
    setWinner(null);
  };

  return (
    <>
      <ErrorMessage
        message={errorMessage}
        onClose={() => setErrorMessage(null)}
      />
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
          <div
            className="team-modal-overlay"
            onClick={(e) => {
              // Închide modalul doar dacă s-a făcut click pe overlay (nu pe conținut)
              if (e.target === e.currentTarget) {
                setShowTeamModal(false);
              }
            }}
          >
            <div className="team-modal">
              <h2>Choose a team</h2>
              <div className="team-grid">
                {/* Echipe */}
                {teams.map((team) => (
                  <div
                    key={team._id}
                    className="team-card"
                    onClick={() => handleItemSelection(team, false)}
                  >
                    <img
                      src={`/logos/${team.logo}`}
                      alt={team.name}
                      className="team-modal-logo"
                    />
                    <span className="team-name">{team.name}</span>
                  </div>
                ))}

                {/* Naționalități */}
                {nationalities.map((nat) => (
                  <div
                    key={nat.flag}
                    className="team-card"
                    onClick={() => handleItemSelection(nat, true)}
                  >
                    <Flag
                      code={nat.flag.toUpperCase()}
                      className="team-modal-logo"
                    />
                    <span className="team-name">{nat.name}</span>
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

        <MemoizedPlayerModal
          show={playerModalState.visible}
          players={playerModalState.players}
          query={playerModalState.query}
          onClose={() =>
            setPlayerModalState((prev) => ({ ...prev, visible: false }))
          }
          onSearch={handlePlayerSearch}
          onSelect={handlePlayerSelection}
          validPlayers={validPlayers} // Trimitem jucătorii valizi către modal
        />

        <div className="tiki-taka-toe">
          <div className="header-row">
            <div className="logo-cell"></div>
            {colItems.map((item, colIndex) => (
              <div
                className={`team-selector ${item ? "occupied" : ""}`}
                key={`col-${colIndex}`}
                onClick={() => !item && handleTeamSelect("col", colIndex)}
              >
                {item ? (
                  item.type === "team" ? (
                    <img
                      src={`/logos/${item.data.logo}`}
                      alt={item.data.logo}
                      className="team-logo"
                    />
                  ) : (
                    <Flag
                      code={item.data.flag.toUpperCase()}
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
                      alt={rowItems[rowIndex].data.logo}
                      className="team-logo"
                    />
                  ) : (
                    <Flag
                      code={rowItems[rowIndex].data.flag.toUpperCase()}
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
                  onClick={() => handlePlayerSelect(rowIndex, colIndex)}
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
        {gameOver && (
          <div className="game-over-overlay">
            <div className="game-status">
              <h2>{winner === "draw" ? "Draw!" : `Winner: ${winner}`}</h2>
              <div className="game-buttons">
                <button onClick={resetGame}>
                  <span>Play again</span>
                </button>
                <button onClick={() => navigate("/")}>
                  <span>Home</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default GamePage;
