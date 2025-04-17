import Header from "../components/header";
import Footer from "../components/footer";
import "../styles/components/home.css"; // Importăm fișierul de stil specific pentru Home

const HomePage = () => {
  return (
    <div className="home-container">
      <Header />
      <main className="home-main">
        <h2 className="home-title">This is the home page</h2>
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
