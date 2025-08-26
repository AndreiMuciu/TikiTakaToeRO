import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import Header from "../components/common/header";
import Footer from "../components/common/footer";
import "../styles/components/invite-page.css";

const socketServerUrl =
  import.meta.env.VITE_INVITE_SOCKET_SERVER_URL ||
  import.meta.env.VITE_SOCKET_SERVER_URL;
const apiUserUrl = import.meta.env.VITE_USERS_API_URL;

function CreateInvitePage() {
  const { league } = useParams();
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [socket, setSocket] = useState(null);
  const [userId, setUserId] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${apiUserUrl}me`, {
          withCredentials: true,
        });
        setUserId(res.data.data.user._id);
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const newSocket = io(socketServerUrl, {
      withCredentials: true,
      query: {
        userId,
        leagueId: league,
        mode: "invite",
      },
      transports: ["websocket"],
    });
    setSocket(newSocket);

    newSocket.on("private_room_created", ({ roomId }) => {
      const link = `${window.location.origin}/invite-game/${league}?room=${roomId}`;
      setRoomId(roomId);
      setInviteLink(link);
    });

    newSocket.on("opponent_joined", ({ roomId }) => {
      navigate(`/invite-game/${league}?room=${roomId}`);
    });

    newSocket.emit("create_private_room", { league, userId });

    return () => newSocket.disconnect();
  }, [userId, league]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Header />
      <div className="invite-container">
        {inviteLink ? (
          <>
            <h2>Invite a Friend</h2>
            <p>Share this link with your friend:</p>

            <div className="link-container">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="invite-link"
              />
              <button onClick={copyToClipboard} className="copy-button">
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            <div className="waiting-message">
              <div className="loading-spinner"></div>
              <p>Waiting for friend to join...</p>
            </div>
          </>
        ) : (
          <div className="loading-status">
            <div className="loading-spinner"></div>
            <p>Creating game room...</p>
          </div>
        )}

        <button
          className="cancel-button"
          onClick={() => {
            if (socket) socket.emit("cancel_private_room", { roomId });
            navigate("/");
          }}
        >
          Cancel
        </button>
      </div>
      <Footer />
    </>
  );
}

export default CreateInvitePage;
