import { useNavigate } from "react-router-dom";
import Header from "../components/header";
import Footer from "../components/footer";
import "../styles/components/home.css";
import GameModeBtn from "../components/game-mode-btn";
import GameRulesBtn from "../components/game-rules-btn";

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

            <GameRulesBtn onClick={handleShowRules} text="Game rules" />
          </div>
        </div>

        {/* Add more sections here later */}
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
