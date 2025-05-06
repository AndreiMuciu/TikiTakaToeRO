const { Server } = require("socket.io");
const User = require("./models/userModel"); // Import User

let waitingPlayersPerLeague = {}; // cheie: leagueId -> socket
const activeGames = {}; // cheie: roomId -> { board, nextTurn, players }

function initializeSocketServer(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  function checkWinner(board) {
    const lines = [
      // rânduri
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
      // coloane
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
      // diagonale
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

    for (let line of lines) {
      const [a, b, c] = line;
      const symbol = board[a[0]][a[1]];
      if (
        symbol &&
        symbol === board[b[0]][b[1]] &&
        symbol === board[c[0]][c[1]]
      ) {
        return symbol;
      }
    }
    return null;
  }

  io.on("connection", (socket) => {
    const { leagueId, userId } = socket.handshake.query;
    console.log(
      `New player connected: ${socket.id}, leagueId: ${leagueId}, userId: ${userId}`
    );

    if (!leagueId || !userId) {
      console.log("No leagueId or userId provided, disconnecting...");
      socket.disconnect();
      return;
    }

    // Salvăm userId-ul pe socket
    socket.data.userId = userId;

    if (waitingPlayersPerLeague[leagueId]) {
      const waitingSocket = waitingPlayersPerLeague[leagueId];
      const roomId = `${waitingSocket.id}-${socket.id}`;

      socket.join(roomId);
      waitingSocket.join(roomId);

      // Salvăm și opponent info pe socket
      socket.data.roomId = roomId;
      socket.data.opponentSocketId = waitingSocket.id;
      socket.data.opponentUserId = waitingSocket.data.userId;

      waitingSocket.data.roomId = roomId;
      waitingSocket.data.opponentSocketId = socket.id;
      waitingSocket.data.opponentUserId = socket.data.userId;

      io.to(roomId).emit("start_game", {
        roomId,
        player1: waitingSocket.id,
        player2: socket.id,
        symbols: {
          [waitingSocket.id]: "X",
          [socket.id]: "O",
        },
      });

      activeGames[roomId] = {
        board: Array(3)
          .fill(null)
          .map(() => Array(3).fill(null)),
        nextTurn: "X", // mereu începe X
        players: {
          X: waitingSocket.data.userId,
          O: socket.data.userId,
        },
      };

      socket.on("select_item", ({ type, index, item }) => {
        const roomId = socket.data.roomId;
        if (!roomId) return;

        socket.to(roomId).emit("item_selected", { type, index, item });
      });

      delete waitingPlayersPerLeague[leagueId];
    } else {
      waitingPlayersPerLeague[leagueId] = socket;
    }

    socket.on("make_move", async ({ roomId, moveData }) => {
      const game = activeGames[roomId];
      if (!game) return;

      const { row, col, player, userId } = moveData;

      // VALIDĂRI
      if (game.board[row][col] !== null) return; // deja ocupat
      if (game.nextTurn !== player) return; // nu e rândul tău
      if (game.players[player] !== userId) return; // jucător nevalid

      // Aplicăm mutarea
      game.board[row][col] = player;

      // Verificăm câștigător
      const winner = checkWinner(game.board);
      if (winner) {
        io.to(roomId).emit("update_board", moveData);
        io.to(roomId).emit("game_won", { winner: game.players[winner] });

        // Update scor în DB
        try {
          await User.findByIdAndUpdate(game.players[winner], {
            $inc: { numberOfMatches: 1, numberOfWins: 1 },
          });
          const loser = winner === "X" ? "O" : "X";
          await User.findByIdAndUpdate(game.players[loser], {
            $inc: { numberOfMatches: 1 },
          });
        } catch (error) {
          console.error("DB error:", error);
        }

        delete activeGames[roomId];
        return;
      }

      // Verificăm dacă e remiză (toate celulele ocupate)
      const isDraw = game.board.flat().every((cell) => cell !== null);
      if (isDraw) {
        io.to(roomId).emit("update_board", moveData);
        io.to(roomId).emit("game_draw"); // trimite mesaj de remiză

        // Update scor în DB pentru amândoi (fără victorie)
        try {
          await User.findByIdAndUpdate(game.players.X, {
            $inc: { numberOfMatches: 1 },
          });
          await User.findByIdAndUpdate(game.players.O, {
            $inc: { numberOfMatches: 1 },
          });
        } catch (error) {
          console.error("DB error:", error);
        }

        delete activeGames[roomId];
        return;
      }

      // Nu e câștigător, trimitem mutarea
      game.nextTurn = player === "X" ? "O" : "X";
      io.to(roomId).emit("update_board", moveData);
    });

    socket.on("disconnect", async () => {
      if (socket.data.gameFinished) return;

      socket.data.gameFinished = true;

      const opponentSocketId = socket.data.opponentSocketId;
      const opponentUserId = socket.data.opponentUserId;
      const userId = socket.data.userId;

      if (opponentSocketId && opponentUserId) {
        const opponentSocket = io.sockets.sockets.get(opponentSocketId);
        if (opponentSocket) {
          opponentSocket.data.gameFinished = true;
        }

        io.to(opponentSocketId).emit("game_won", { winner: opponentUserId });

        try {
          await User.findByIdAndUpdate(opponentUserId, {
            $inc: { numberOfMatches: 1, numberOfWins: 1 },
          });

          await User.findByIdAndUpdate(userId, {
            $inc: { numberOfMatches: 1 },
          });
        } catch (error) {
          console.error("Database update error:", error);
        }

        io.to(opponentSocketId).emit("opponent_disconnected");
      }

      // curăță jocul
      if (socket.data.roomId) {
        delete activeGames[socket.data.roomId];
      }

      // curăță din waiting
      for (const league in waitingPlayersPerLeague) {
        if (waitingPlayersPerLeague[league]?.id === socket.id) {
          delete waitingPlayersPerLeague[league];
        }
      }
    });
  });

  return io;
}

module.exports = initializeSocketServer;
