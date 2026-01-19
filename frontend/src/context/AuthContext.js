import React, { createContext, useState, useContext, useEffect } from "react";
import AuthService from "../services/authService";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUser = () => {
      try {
        const savedUser = AuthService.getCurrentUser();
        if (savedUser && AuthService.isAuthenticated()) {
          setUser(savedUser);
        }
      } catch (err) {
        console.error("Failed to load user:", err);
        AuthService.clearAuth();
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    setError(null);

    console.log("Login attempt with username:", { username, password });

    try {
      const response = await AuthService.login(username, password);
      console.log("Login successful:", response);

      setUser(response.user);

      // Redirect based on role
      switch (response.user.user_role) {
        case "admin":
          window.location.href = "/admin";
          break;
        case "staff":
          window.location.href = "/staff";
          break;
        case "client":
          window.location.href = "/client";
          break;
        case "contractor":
          window.location.href = "/contractor";
          break;
        default:
          window.location.href = "/login";
      }
    } catch (err) {
      console.log("Login error:", err.response?.data);
      const errorMessage =
        err.response?.data?.message ||
        "Login failed. Please check your credentials.";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      AuthService.clearAuth();
      window.location.href = "/login";
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
