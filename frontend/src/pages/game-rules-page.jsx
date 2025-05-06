import "../styles/components/game-rules.css";
import Header from "../components/common/header";
import Footer from "../components/common/footer";
import { Link } from "react-router-dom";

function GameRulesPage() {
  return (
    <>
      <Header />

      <div className="rules-container">
        <h1>Game rules</h1>
        <p>
          This is a game of X and 0 with soccer players, inspired by{" "}
          <a
            href="https://playfootball.games/footy-tic-tac-toe/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Footy Tic Tac Toe
          </a>
          .
        </p>
        <ul>
          <li>The game takes place on a 3x3 board.</li>
          <li>It is played in turns: one player is "X", the other is "0".</li>
          <li>
            The goal is to line up 3 identical symbols (X or 0) horizontally,
            vertically or diagonally.
          </li>
          <li>Each position on the board can only be occupied once.</li>
          <li>
            If all 9 squares are occupied without a winner, the game ends in a
            draw.
          </li>
          <li>
            Each player takes turns choosing a football team on a free column or
            line.
          </li>
          <li>
            In order to put an 'x' or '0' on the board, you will need to write a
            football player who meets the conditions on the respective row and
            column.
          </li>
        </ul>
        <Link to="/" className="home-button">
          🏠 Back to Home
        </Link>
      </div>
      <Footer />
    </>
  );
}

export default GameRulesPage;
