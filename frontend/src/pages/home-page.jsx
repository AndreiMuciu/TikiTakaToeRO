import { useNavigate } from "react-router-dom";
import Header from "../components/common/header";
import Footer from "../components/common/footer";
import "../styles/components/home.css";
import GameModeBtn from "../components/home/game-mode-btn";
import GameRulesBtn from "../components/home/game-rules-btn";

const HomePage = () => {
  const navigate = useNavigate();

  const handleSameScreenGame = () => {
    navigate("/game-same-screen");
  };

  const handleShowRules = () => {
    navigate("/game-rules");
  };

  const handleOnlineGame = () => {
    navigate("/game-online");
  };

  const handleInviteFriend = () => {
    navigate("/game-invite-friend");
  };

  return (
    <div className="home-container">
      <Header />
      <main className="home-main">
        <div className="hero-section">
          <h1 className="hero-title">Are you ready to play??</h1>
          <p className="hero-subtitle">Choose your favorite game mode!</p>

          <div className="cta-buttons">
            <GameModeBtn
              onClick={handleSameScreenGame}
              text="Play on the same screen"
            />
            <GameModeBtn onClick={handleOnlineGame} text="Play a game online" />
            <GameModeBtn
              onClick={handleInviteFriend}
              text="Invite a friend to play"
            />

            <GameRulesBtn onClick={handleShowRules} text="Game rules" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
