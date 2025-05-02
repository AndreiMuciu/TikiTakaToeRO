import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios"; // <-- Import Axios
import "../styles/components/game-online.css";

const socketServerUrl = import.meta.env.VITE_SOCKET_SERVER_URL;
const apiUserUrl = import.meta.env.VITE_USERS_API_URL;

function GamePageOnline() {
  const navigate = useNavigate();
  const { league } = useParams();
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [board, setBoard] = useState(
    [...Array(3)].map(() => Array(3).fill(null))
  );
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);

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

        newSocket.on("start_game", ({ roomId }) => {
          setRoomId(roomId);
          console.log("Game started in room:", roomId);
        });

        newSocket.on("update_board", (moveData) => {
          const { row, col, player } = moveData;
          setBoard((prevBoard) => {
            const newBoard = prevBoard.map((r) => [...r]);
            newBoard[row][col] = player;
            return newBoard;
          });
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

  return (
    <div className="game-container">
      {gameOver && (
        <div className="game-over-container">
          <h2>{winner === userId ? "Ai câștigat!" : "Ai pierdut!"}</h2>
          <p>The game is over because your opponent has left the game</p>
          <p>You will be redirected...</p>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-4">Game Page Online</h1>
      <p className="room-id">Room ID: {roomId}</p>

      <div className="board">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div key={`${rowIndex}-${colIndex}`} className="cell">
              {cell}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default GamePageOnline;
