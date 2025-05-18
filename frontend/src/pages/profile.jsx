import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/common/header";
import Footer from "../components/common/footer";
import "../styles/components/profile.css";

function Profile() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
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
        alert("Profile updated successfully!");
      } else {
        alert("Error updating profile.");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating profile.");
    }
  };

  const handleDeleteMe = async () => {
    if (confirm("Are you sure you want to delete your account?")) {
      try {
        await axios.patch(`${apiUrl}deleteMe`, {}, { withCredentials: true });
        alert("Your account was deleted!");
        navigate("/"); // Redirect la pagina principală
      } catch (err) {
        console.error(err);
        alert("Error deleting account.");
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
      return alert("The passwords are different!");
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
        alert("Password has been changed successfully!");
        setFormChangePassword({
          currentPassword: "",
          newPassword: "",
          newPasswordConfirm: "",
        });
      } else {
        alert("Error changing password.");
      }
    } catch (err) {
      console.error(err);
      alert("Error changing password.");
    }
  };

  return (
    <>
      <Header />
      <div className="profile-container">
        <div className="profile-header">
          <h1 className="profile-header-title">Your profile</h1>
          <button
            onClick={() => navigate("/")}
            className="profile-header-back-button"
          >
            Home page
          </button>
        </div>

        {/* User Stats Section */}
        {user && (
          <div className="profile-stats-section">
            <h2 className="profile-stats-title">Stats</h2>
            <div className="profile-stats-grid">
              <div className="profile-stats-item">
                <strong>{user.numberOfMatches}</strong>
                <span>Matches played</span>
              </div>
              <div className="profile-stats-item">
                <strong>{user.numberOfWins}</strong>
                <span>Wins</span>
              </div>
              <div className="profile-stats-item">
                <strong>
                  {user.numberOfMatches === 0
                    ? 0
                    : (
                        (user.numberOfWins / user.numberOfMatches) *
                        100
                      ).toFixed(2)}
                  %
                </strong>
                <span>Winrate</span>
              </div>
            </div>
          </div>
        )}

        {/* Profile Update Section */}
        <div className="profile-update-section">
          <h2 className="profile-update-title">Update your profile</h2>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Username"
            className="profile-update-input"
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            className="profile-update-input"
          />
          <button onClick={handleUpdate} className="profile-update-button">
            Save
          </button>
        </div>

        {/* Password Change Section */}
        <div className="profile-password-section">
          <h2 className="profile-password-title">Change password</h2>
          <input
            type="password"
            name="currentPassword"
            value={formChangePassword.currentPassword}
            onChange={handlePasswordChange}
            placeholder="Current password"
            className="profile-password-input"
          />
          <input
            type="password"
            name="newPassword"
            value={formChangePassword.newPassword}
            onChange={handlePasswordChange}
            placeholder="New password"
            className="profile-password-input"
          />
          <input
            type="password"
            name="newPasswordConfirm"
            value={formChangePassword.newPasswordConfirm}
            onChange={handlePasswordChange}
            placeholder="Confirm new password"
            className="profile-password-input"
          />
          <button
            onClick={handleChangePassword}
            className="profile-password-button"
          >
            Change password
          </button>
        </div>

        {/* Delete Account Section */}
        <div className="profile-delete-section">
          <h2 className="profile-delete-title">Delete your account</h2>
          <button onClick={handleDeleteMe} className="profile-delete-button">
            Delete your account
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Profile;
