// socketServer.js
const { Server } = require("socket.io");

let waitingPlayer = null;

function initializeSocketServer(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("New player connected:", socket.id);

    if (waitingPlayer) {
      const roomId = `${waitingPlayer.id}-${socket.id}`;
      socket.join(roomId);
      waitingPlayer.join(roomId);

      io.to(roomId).emit("start_game", {
        roomId,
        player1: waitingPlayer.id,
        player2: socket.id,
      });

      waitingPlayer = null;
    } else {
      waitingPlayer = socket;
    }

    socket.on("make_move", ({ roomId, moveData }) => {
      socket.to(roomId).emit("update_board", moveData);
    });

    socket.on("disconnect", () => {
      console.log("Player disconnected:", socket.id);
      if (waitingPlayer && waitingPlayer.id === socket.id) {
        waitingPlayer = null;
      }
    });
  });

  return io;
}

module.exports = initializeSocketServer;
