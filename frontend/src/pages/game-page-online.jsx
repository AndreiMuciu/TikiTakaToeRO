import { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socketServerUrl = import.meta.env.VITE_SOCKET_SERVER_URL;
const socket = io(socketServerUrl);

function GamePageOnline() {
  const [roomId, setRoomId] = useState(null);
  const [board, setBoard] = useState(
    [...Array(3)].map(() => Array(3).fill(null))
  );

  useEffect(() => {
    socket.on("start_game", ({ roomId }) => {
      setRoomId(roomId);
      console.log("Game started in room:", roomId);
    });

    socket.on("update_board", (moveData) => {
      const { row, col, player } = moveData;
      setBoard((prevBoard) => {
        const newBoard = [...prevBoard];
        newBoard[row][col] = player;
        return newBoard;
      });
    });

    return () => {
      socket.off("start_game");
      socket.off("update_board");
    };
  });

  return (
    <>
      <h1>Game Page Online</h1>
      <p>This is the game page for online games.</p>
      {/* Add your game logic and components here */}
    </>
  );
}

export default GamePageOnline;
