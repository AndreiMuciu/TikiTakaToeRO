import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/components/profile.css";

function Profile() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    username: "", // Folosim username consistent
    email: "",
  });
  const [formChangePassword, setFormChangePassword] = useState({
    currentPassword: "",
    newPassword: "",
    newPasswordConfirm: "",
  });
  const navigate = useNavigate();

  const apiUrl = import.meta.env.VITE_USERS_API_URL;

  useEffect(() => {
    // Fetch user data from backend
    axios
      .get(`${apiUrl}me`, { withCredentials: true })
      .then((response) => {
        if (response.data.status === "success") {
          setUser(response.data.data.user);
          setFormData({
            username: response.data.data.user.username,
            email: response.data.data.user.email,
          });
        } else {
          console.error("Failed to fetch user data:", response.data.message);
        }
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
      });
  }, [apiUrl]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    try {
      const response = await axios.patch(`${apiUrl}updateMe`, formData, {
        withCredentials: true, // Asigură-te că trimitem cookie-urile pentru sesiune
      });

      if (response.data.status === "success") {
        alert("Profilul a fost actualizat cu succes!");
      } else {
        alert("Eroare la actualizarea profilului.");
      }
    } catch (err) {
      console.error(err);
      alert("Eroare la actualizarea profilului.");
    }
  };

  const handleDeleteMe = async () => {
    if (confirm("Are you sure you want to delete your account?")) {
      try {
        await axios.patch(`${apiUrl}deleteMe`, {}, { withCredentials: true });
        alert("Contul a fost șters!");
        navigate("/"); // Redirect la pagina principală
      } catch (err) {
        console.error(err);
        alert("Eroare la ștergerea contului.");
      }
    }
  };

  const handlePasswordChange = (e) => {
    setFormChangePassword({
      ...formChangePassword,
      [e.target.name]: e.target.value,
    });
  };

  const handleChangePassword = async () => {
    const { currentPassword, newPassword, newPasswordConfirm } =
      formChangePassword;

    if (newPassword !== newPasswordConfirm) {
      return alert("Parolele nu coincid!");
    }

    try {
      const response = await axios.patch(
        `${apiUrl}updateMyPassword`,
        {
          passwordCurrent: currentPassword,
          password: newPassword,
          passwordConfirm: newPasswordConfirm,
        },
        { withCredentials: true }
      );

      if (response.data.status === "success") {
        alert("Parola a fost schimbată cu succes!");
        setFormChangePassword({
          currentPassword: "",
          newPassword: "",
          newPasswordConfirm: "",
        });
      } else {
        alert("Eroare la schimbarea parolei.");
      }
    } catch (err) {
      console.error(err);
      alert("Eroare la schimbarea parolei.");
    }
  };

  return (
    <>
      <Header />
      <div className="profile-container">
        <div className="profile-header">
          <h1 className="profile-title">Your profile</h1>
          <button
            onClick={() => navigate("/")}
            className="profile-button back-button"
          >
            Home page
          </button>
        </div>

        <div className="profile-section">
          <h2>Stats</h2>
          <div className="profile-stats">
            <div className="stat-item">
              <strong>{0}</strong>
              <span>Matches played</span>
            </div>
            <div className="stat-item">
              <strong>{0}</strong>
              <span>wins</span>
            </div>
            <div className="stat-item">
              <strong>{0}%</strong>
              <span>Winrate</span>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2>Update your profile</h2>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Username"
            className="profile-input"
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            className="profile-input"
          />
          <button onClick={handleUpdate} className="profile-button">
            Save
          </button>
        </div>

        <div className="profile-section">
          <h2>Change password</h2>
          <input
            type="password"
            name="currentPassword"
            value={formChangePassword.currentPassword}
            onChange={handlePasswordChange}
            placeholder="Current password"
            className="profile-input"
          />
          <input
            type="password"
            name="newPassword"
            value={formChangePassword.newPassword}
            onChange={handlePasswordChange}
            placeholder="New password"
            className="profile-input"
          />
          <input
            type="password"
            name="newPasswordConfirm"
            value={formChangePassword.newPasswordConfirm}
            onChange={handlePasswordChange}
            placeholder="Confirm your new password"
            className="profile-input"
          />
          <button
            onClick={handleChangePassword}
            className="profile-button green"
          >
            Change password
          </button>
        </div>

        <div className="profile-section">
          <h2 className="text-red-600">Delete your account</h2>
          <button onClick={handleDeleteMe} className="profile-button red">
            Delete your account
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Profile;
