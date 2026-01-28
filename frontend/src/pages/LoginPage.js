import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import "./LoginPage.css";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setUsername("");
    setPassword("");
  }, []);

  useEffect(() => {
    // Check if user is already logged in
    const user = localStorage.getItem("user");
    if (user) {
      const parsedUser = JSON.parse(user);
      switch (parsedUser.user_role) {
        case "admin":
          navigate("/admin");
          break;
        case "staff":
          navigate("/staff");
          break;
        case "client":
          navigate("/client");
          break;
        case "contractor":
          navigate("/contractor");
          break;
        default:
          break;
      }
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(username, password, rememberMe);
  };

  const fillCredentials = (user, pass) => {
    setUsername(user);
    setPassword(pass);
  };
  const handleForgotPassword = () => {
    navigate("/forgot-password");
};

  return (
    <div className="login-container">
      {/* Animated background */}
      <div className="background-gradient">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      {/* Main content */}
      <div className="login-content">
        <div className="login-card">
      
          {/* Header */}
          <div className="login-header">
            <div className="logo-wrapper">

            </div>
            <h1 className="login-title">LOG IN YOUR ACCOUNT </h1>
            <p className="login-subtitle">Welcome back! Please sign in</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            {/* Username Field */}
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                <i className="pi pi-user"></i>
                <span>Username</span>
              </label>
              <div
                className={`input-wrapper ${
                  focusedField === "username" ? "focused" : ""
                }`}
              >
                <InputText
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedField("username")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter your username"
                  required
                  disabled={loading}
                  className="form-input"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                <i className="pi pi-lock"></i>
                <span>Password</span>
              </label>
              <div
                className={`input-wrapper ${
                  focusedField === "password" ? "focused" : ""
                }`}
                style={{ position: "relative" }}
              >
                <InputText
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  className="form-input"
                />
                <span
                  className="custom-eye-icon pi"
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: "14px",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                    color: "#404a17",
                    fontSize: "18px",
                  }}
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? (
                    <i className="pi pi-eye-slash" />
                  ) : (
                    <i className="pi pi-eye" />
                  )}
                </span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message-wrapper">
                <Message severity="error" text={error} className="w-full" />
              </div>
            )}

            {/* Remember Me */}
            <div className="form-footer">
              <div className="remember-wrapper">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  className="remember-checkbox"
                />
                <label htmlFor="rememberMe" className="remember-label">
                  Remember me
                </label>
              </div>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              label={loading ? "Signing in..." : "Sign In"}
              icon="pi pi-sign-in"
              loading={loading}
              disabled={loading}
              className="signin-button"
            />
          </form>
          <Button
            label={loading ? "" : "Forgot password?"}
            className="forgot-password-button"
          />

          {/* Divider */}
          <div className="divider-wrapper">
            <div className="divider-line"></div>
            <span className="divider-text">Demo Credentials</span>
            <div className="divider-line"></div>
          </div>

          {/* Footer */}
          <div className="login-footer">
            <p className="footer-text">
              © 2026 Project Management System. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
