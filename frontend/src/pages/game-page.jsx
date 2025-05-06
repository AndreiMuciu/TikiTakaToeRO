import { useState, useEffect } from "react";
import "../styles/components/game.css"; // Import your CSS file for styling
import Header from "../components/common/header";
import Footer from "../components/common/footer";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import MemoizedPlayerModal from "../components/same-screen-game/player-modal"; // Numele corect
import { debounce, set } from "lodash";
import ErrorMessage from "../components/common/error-message";
import TeamModal from "../components/same-screen-game/team-modal";
import TeamSelectorCell from "../components/same-screen-game/team-selector-cell";
import GameOverModal from "../components/same-screen-game/game-over-modal";
import CurrentTurn from "../components/same-screen-game/current-turn";
import {
  europeanTopTeamIds,
  SuperligaNationalities,
  uefaCountries,
} from "../dataStuff";

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
  const [validPlayers, setValidPlayers] = useState([]);

  const [playerModalState, setPlayerModalState] = useState({
    visible: false,
    players: [],
    query: "",
    cell: { row: null, col: null },
  });

  const apiTeams = import.meta.env.VITE_TEAMS_API_URL;
  const apiPlayers = import.meta.env.VITE_PLAYERS_API_URL;
  const { league } = useParams();

  const nationalities =
    league === "europe" ? uefaCountries : SuperligaNationalities;

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
            nationality,
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
    for (let i = 0; i < 3; i++) {
      if (
        grid[i][0].symbol &&
        grid[i][0].symbol === grid[i][1].symbol &&
        grid[i][1].symbol === grid[i][2].symbol
      ) {
        return grid[i][0].symbol;
      }
    }

    for (let j = 0; j < 3; j++) {
      if (
        grid[0][j].symbol &&
        grid[0][j].symbol === grid[1][j].symbol &&
        grid[1][j].symbol === grid[2][j].symbol
      ) {
        return grid[0][j].symbol;
      }
    }

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

  const handleSkipTurn = () => {
    if (gameOver) return;
    setCurrentPlayer((prev) => (prev === "X" ? "O" : "X"));
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
        <CurrentTurn
          currentPlayer={currentPlayer}
          onSkipTurn={handleSkipTurn}
        />

        <TeamModal
          show={showTeamModal}
          teams={teams}
          nationalities={nationalities}
          onSelect={handleItemSelection}
          onClose={() => setShowTeamModal(false)}
        />

        <MemoizedPlayerModal
          show={playerModalState.visible}
          players={playerModalState.players}
          query={playerModalState.query}
          onClose={() =>
            setPlayerModalState((prev) => ({ ...prev, visible: false }))
          }
          onSearch={handlePlayerSearch}
          onSelect={handlePlayerSelection}
          validPlayers={validPlayers}
        />

        <div className="tiki-taka-toe">
          <div className="header-row">
            <div className="logo-cell"></div>
            {colItems.map((item, colIndex) => (
              <TeamSelectorCell
                key={`col-${colIndex}`}
                item={item}
                onClick={() => !item && handleTeamSelect("col", colIndex)}
              />
            ))}
          </div>

          {grid.map((row, rowIndex) => (
            <div className="grid-row" key={`row-${rowIndex}`}>
              <TeamSelectorCell
                item={rowItems[rowIndex]}
                onClick={() =>
                  !rowItems[rowIndex] && handleTeamSelect("row", rowIndex)
                }
              />
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
          <GameOverModal
            winner={winner}
            onReset={resetGame}
            onHome={() => navigate("/")}
          />
        )}
      </div>
      <Footer />
    </>
  );
};

export default GamePage;
