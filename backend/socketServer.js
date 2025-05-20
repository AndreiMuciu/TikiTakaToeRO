const { Server } = require("socket.io");
const User = require("./models/userModel");

let waitingPlayersPerLeague = {};
const activeGames = {};

function initializeSocketServer(server) {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
      methods: ["GET", "POST"],
      credentials: true,
    },
    // Adaugă setări pentru compatibilitate
    allowEIO3: true,
    cookie: true,
  });

  function checkWinner(board) {
    const lines = [
      [
        [0, 0],
        [0, 1],
        [0, 2],
      ],
      [
        [1, 0],
        [1, 1],
        [1, 2],
      ],
      [
        [2, 0],
        [2, 1],
        [2, 2],
      ],
      [
        [0, 0],
        [1, 0],
        [2, 0],
      ],
      [
        [0, 1],
        [1, 1],
        [2, 1],
      ],
      [
        [0, 2],
        [1, 2],
        [2, 2],
      ],
      [
        [0, 0],
        [1, 1],
        [2, 2],
      ],
      [
        [0, 2],
        [1, 1],
        [2, 0],
      ],
    ];

    for (const line of lines) {
      const [a, b, c] = line;
      const aCell = board[a[0]][a[1]];
      const bCell = board[b[0]][b[1]];
      const cCell = board[c[0]][c[1]];

      if (
        aCell.symbol &&
        aCell.symbol === bCell.symbol &&
        aCell.symbol === cCell.symbol
      ) {
        return {
          symbol: aCell.symbol,
          player: aCell.player,
          line: line,
        };
      }
    }
    return null;
  }

  io.on("connection", (socket) => {
    const { leagueId, userId } = socket.handshake.query;

    // Validare conexiune
    if (!leagueId || !userId || typeof userId !== "string") {
      socket.disconnect();
      return;
    }

    socket.data.userId = userId;
    socket.data.leagueId = leagueId;

    // Handler reconectare
    socket.on("reconnect_game", ({ roomId }) => {
      const game = activeGames[roomId];
      if (game && (game.players.X === userId || game.players.O === userId)) {
        socket.join(roomId);
        socket.data.roomId = roomId;
        socket.emit("game_state", game);
      }
    });

    // Handler selectie echipa
    socket.on("select_item", ({ type, index, item }) => {
      const roomId = socket.data.roomId;
      const game = activeGames[roomId];
      if (!game) return;

      const playerSymbol = game.players.X === userId ? "X" : "O";
      if (game.teamTurn !== playerSymbol) return;

      const selectionType = type === "row" ? "rows" : "cols";
      const otherType = type === "row" ? "cols" : "rows";

      // Verificare duplicat
      const alreadySelected = [
        ...game.teamSelections.rows,
        ...game.teamSelections.cols,
      ].some(
        (existingItem, i) =>
          existingItem &&
          i !== index &&
          existingItem.type === item.type &&
          existingItem.data.name === item.data.name
      );

      if (alreadySelected) return; // Ignoră dacă item-ul este deja ales

      if (game.teamSelections[selectionType][index] !== null) return;

      game.teamSelections[selectionType][index] = item;
      game.teamTurn = playerSymbol === "X" ? "O" : "X";

      io.to(roomId).emit("update_team_state", game.teamSelections);
      io.to(roomId).emit("update_team_turn", { nextTurn: game.teamTurn });
    });

    // Matchmaking
    if (waitingPlayersPerLeague[leagueId]) {
      const waitingSocket = waitingPlayersPerLeague[leagueId];

      if (waitingSocket.disconnected) {
        delete waitingPlayersPerLeague[leagueId];
        waitingPlayersPerLeague[leagueId] = socket;
        return;
      }

      const roomId = `${waitingSocket.id}-${socket.id}`;

      // Initializare joc
      activeGames[roomId] = {
        board: Array(3)
          .fill()
          .map(() =>
            Array(3)
              .fill()
              .map(() => ({ player: null, symbol: null, team: null }))
          ),
        nextTurn: "X",
        teamTurn: "X",
        players: {
          X: waitingSocket.data.userId,
          O: socket.data.userId,
        },
        teamSelections: {
          rows: Array(3).fill(null),
          cols: Array(3).fill(null),
        },
      };

      // Configurare socketuri
      [socket, waitingSocket].forEach((s) => {
        s.join(roomId);
        s.data.roomId = roomId;
        s.data.opponentSocketId = s === socket ? waitingSocket.id : socket.id;
      });

      // Trimite starea initiala
      io.to(roomId).emit("start_game", {
        roomId,
        symbols: { [waitingSocket.id]: "X", [socket.id]: "O" },
        initialTeamTurn: "X",
        initialSelections: activeGames[roomId].teamSelections,
      });

      delete waitingPlayersPerLeague[leagueId];
    } else {
      waitingPlayersPerLeague[leagueId] = socket;
    }

    // Handler mutare
    socket.on("make_move", async ({ row, col, player, selectedPlayer }) => {
      console.log("Make move", { row, col, player, selectedPlayer });
      const roomId = socket.data.roomId;
      const game = activeGames[roomId];
      if (!game) return;

      // Determină simbolul jucătorului curent după userId
      const playerSymbol = game.players.X === socket.data.userId ? "X" : "O";

      // Validări: este rândul lui? Este celula liberă? Au fost făcute selecțiile?
      if (
        game.nextTurn !== playerSymbol ||
        game.board[row][col].symbol !== null ||
        game.teamSelections.rows.some((x) => x === null) ||
        game.teamSelections.cols.some((x) => x === null)
      ) {
        return socket.emit("move_error", "Invalid move");
      }

      // Actualizează board-ul folosind simbolul determinat pe server
      game.board[row][col] = {
        player: socket.data.userId,
        symbol: playerSymbol,
        team: selectedPlayer,
      };

      // Schimbă tura
      game.nextTurn = playerSymbol === "X" ? "O" : "X";

      io.to(roomId).emit("update_board", {
        row,
        col,
        player: playerSymbol,
        selectedPlayer,
      });

      // Verifica castigator
      const winner = checkWinner(game.board);
      if (winner) {
        // Update baza de date
        try {
          await User.findByIdAndUpdate(winner.player, {
            $inc: { numberOfMatches: 1, numberOfWins: 1 },
          });
          await User.findByIdAndUpdate(
            winner.player === game.players.X ? game.players.O : game.players.X,
            { $inc: { numberOfMatches: 1 } }
          );
        } catch (error) {
          console.error("DB update error:", error);
        }

        io.to(roomId).emit("game_won", {
          winner: winner.player,
          winningLine: winner.line,
        });
        delete activeGames[roomId];
        return;
      }

      // Verifica remiza
      if (game.board.flat().every((cell) => cell.symbol !== null)) {
        try {
          await User.findByIdAndUpdate(game.players.X, {
            $inc: { numberOfMatches: 1 },
          });
          await User.findByIdAndUpdate(game.players.O, {
            $inc: { numberOfMatches: 1 },
          });
        } catch (error) {
          console.error("DB update error:", error);
        }

        io.to(roomId).emit("game_draw");
        delete activeGames[roomId];
        return;
      }
    });

    // Handler deconectare
    socket.on("disconnect", async () => {
      const roomId = socket.data.roomId;
      const game = activeGames[roomId];

      if (game && !game.finished) {
        game.finished = true;
        const opponentId =
          game.players[socket.data.userId === game.players.X ? "O" : "X"];

        try {
          await User.findByIdAndUpdate(opponentId, {
            $inc: { numberOfWins: 1, numberOfMatches: 1 },
          });
          await User.findByIdAndUpdate(socket.data.userId, {
            $inc: { numberOfMatches: 1 },
          });
        } catch (error) {
          console.error("DB update error:", error);
        }

        io.to(roomId).emit("opponent_disconnected", { winner: opponentId });
        delete activeGames[roomId];
      }

      // Curata lista de asteptare
      if (waitingPlayersPerLeague[socket.data.leagueId]?.id === socket.id) {
        delete waitingPlayersPerLeague[socket.data.leagueId];
      }
    });
  });

  return io;
}

module.exports = initializeSocketServer;
