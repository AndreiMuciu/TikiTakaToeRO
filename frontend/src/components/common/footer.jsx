import "../../styles/components/footer.css"; // Import your CSS file for styling

const Footer = () => {
  return (
    <footer className="footer">
      <p>
        &copy; {new Date().getFullYear()} TikiTakaToeRO. Made with ❤️ by Andrei
        Mucioniu. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
