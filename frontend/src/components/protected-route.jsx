import { Navigate, Outlet } from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";

const ProtectedRoute = () => {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const apiUrl = import.meta.env.VITE_USERS_API_URL;

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const res = await axios.get(`${apiUrl}me`, {
          withCredentials: true, // esențial pentru cookies!
        });
        if (res.data?.data?.user) {
          setIsAuthenticated(true);
        }
      } catch (err) {
        setIsAuthenticated(false);
      } finally {
        setAuthChecked(true);
      }
    };

    verifyAuth();
  }, []);

  if (!authChecked) return <p>Loading...</p>;

  return isAuthenticated ? (
    <Outlet />
  ) : (
    <Navigate to="/access-denied" replace />
  );
};

export default ProtectedRoute;
