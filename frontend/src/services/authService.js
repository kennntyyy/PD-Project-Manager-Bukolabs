import api from "./api";

const AuthService = {
  async login(username, password, rememberMe = false) {
    // Validate username length (3-50 characters as per backend)
    if (!username || username.length < 3 || username.length > 50) {
      throw new Error("Username must be 3-50 characters");
    }

    // Validate password length (6-32 characters as per backend)
    if (!password || password.length < 6 || password.length > 32) {
      throw new Error("Password must be 6-32 characters");
    }

    console.log("Sending to API:", { username, password });

    const response = await api.post("/auth/login", {
      username: username.trim(),
      password: password,
    });

    console.log("API Response:", response.data);

    if (response.data.access_token && response.data.user) {
      if (rememberMe) {
        localStorage.setItem("access_token", response.data.access_token);
        localStorage.setItem("refresh_token", response.data.refresh_token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("refresh_token");
        sessionStorage.removeItem("user");
      } else {
        sessionStorage.setItem("access_token", response.data.access_token);
        sessionStorage.setItem("refresh_token", response.data.refresh_token);
        sessionStorage.setItem("user", JSON.stringify(response.data.user));
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
      }
    }

    return response.data;
  },

  async logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      this.clearAuth();
    }
  },

  clearAuth() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("user");
  },

  getCurrentUser() {
    const userStr =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  getAccessToken() {
    return (
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token")
    );
  },

  isAuthenticated() {
    return !!this.getAccessToken();
  },

  getUserRole() {
    const user = this.getCurrentUser();
    return user ? user.user_role : null;
  },

  getDashboardPath(role) {
    switch (role) {
      case "admin":
        return "/admin";
      case "staff":
        return "/staff";
      case "client":
        return "/client";
      case "contractor":
        return "/contractor";
      default:
        return "/login";
    }
  },

  async validateSession() {
    // Validate session by calling backend
    try {
      const token = this.getAccessToken();
      if (!token) {
        return false;
      }
      // Call a protected endpoint to verify token is still valid
      const response = await api.get("/users/profile");
      return !!response.data;
    } catch (error) {
      console.error("Session validation failed:", error);
      this.clearAuth();
      return false;
    }
  },
};

export default AuthService;
