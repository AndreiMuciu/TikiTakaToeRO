import "../styles/components/select-league.css";
import { useNavigate } from "react-router-dom";
import Header from "../components/common/header";
import Footer from "../components/common/footer";
import Flag from "react-world-flags";
import BackButton from "../components/common/back-button";

const leagues = [
  { name: "European League", id: "europe", flag: "EU" },
  { name: "Romanian League", id: "romania", flag: "ro" },
];

const SelectLeague = () => {
  const navigate = useNavigate();

  const handleSelect = (leagueId) => {
    const currentPath = location.pathname;
    console.log("Current Path:", currentPath);
    navigate(`${currentPath}/${leagueId}`);
  };
  const handleHomeClick = () => {
    navigate("/");
  };

  return (
    <>
      <Header />
      <div className="select-league-wrapper">
        <h1 className="select-league-header">Choose Your League</h1>
        <div className="league-list">
          {leagues.map((league) => (
            <div key={league.id} className="league-item">
              <div className="league-info">
                <Flag
                  code={league.flag}
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    aspectRatio: "1 / 1",
                  }}
                />
                <div className="league-text">
                  <div className="league-name">{league.name}</div>
                  <div className="league-subtitle">Pass and Play</div>
                </div>
              </div>
              <button
                className="play-button"
                onClick={() => handleSelect(league.id)}
              >
                PLAY
              </button>
            </div>
          ))}
        </div>
        <div className="navigation-container">
          <BackButton text="Back to Home" navigateTo="/" />
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SelectLeague;
