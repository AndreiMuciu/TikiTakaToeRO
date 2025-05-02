const { Server } = require("socket.io");
const User = require("./models/userModel"); // Import User

let waitingPlayersPerLeague = {}; // cheie: leagueId -> socket

function initializeSocketServer(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

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
      });

      delete waitingPlayersPerLeague[leagueId];
    } else {
      waitingPlayersPerLeague[leagueId] = socket;
    }

    socket.on("make_move", ({ roomId, moveData }) => {
      socket.to(roomId).emit("update_board", moveData);
    });

    socket.on("disconnect", async () => {
      if (socket.data.gameFinished) return; // Dacă deja s-a procesat

      socket.data.gameFinished = true;

      const opponentSocketId = socket.data.opponentSocketId;
      const opponentUserId = socket.data.opponentUserId;
      const userId = socket.data.userId;

      if (opponentSocketId && opponentUserId) {
        const opponentSocket = io.sockets.sockets.get(opponentSocketId);
        if (opponentSocket) {
          opponentSocket.data.gameFinished = true; // și la adversar
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
