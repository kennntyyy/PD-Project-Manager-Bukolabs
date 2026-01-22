import React, { createContext, useState, useContext, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import AuthService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLogoutWarning, setShowLogoutWarning] = useState(false);
  const [logoutWarningCountdown, setLogoutWarningCountdown] = useState(10);
  const logoutTimerRef = React.useRef(null);
  const refreshTimerRef = React.useRef(null);
  const inactivityTimerRef = React.useRef(null);
  const countdownTimerRef = React.useRef(null);
  const lastActivityRef = React.useRef(Date.now());
  // Helper: get token expiration
  const getTokenExpiration = (token) => {
    if (!token) return 0;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000;
    } catch {
      return 0;
    }
  };

  // Helper: schedule token refresh
  const scheduleTokenRefresh = (token) => {
    const exp = getTokenExpiration(token);
    const now = Date.now();
    // Refresh 1 minute before expiry
    const refreshTime = exp - now - 60 * 1000;
    if (refreshTime > 0) {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(async () => {
        try {
          const newToken = await AuthService.refreshAccessToken();
          scheduleTokenRefresh(newToken);
        } catch (err) {
          logout();
        }
      }, refreshTime);
    }
  };

  // Track user activity and handle inactivity logout
  useEffect(() => {
    // Only set up inactivity tracking if user is logged in
    if (!user) {
      return;
    }

    const resetInactivityTimer = () => {
      lastActivityRef.current = Date.now();
      setShowLogoutWarning(false);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
      setLogoutWarningCountdown(10);
      // Show warning at 50 minutes (10 minutes before logout at 60)
      inactivityTimerRef.current = setTimeout(
        () => {
          setShowLogoutWarning(true);
          setLogoutWarningCountdown(10);
          // Start countdown
          let countdown = 10;
          countdownTimerRef.current = setInterval(() => {
            countdown -= 1;
            setLogoutWarningCountdown(countdown);
            if (countdown <= 0) {
              clearInterval(countdownTimerRef.current);
              logout();
            }
          }, 1000);
        },
        50 * 60 * 1000,
      ); // Show warning after 50 minutes
    };
    window.addEventListener('mousemove', resetInactivityTimer);
    window.addEventListener('keydown', resetInactivityTimer);
    window.addEventListener('touchstart', resetInactivityTimer);
    window.addEventListener('touchend', resetInactivityTimer);
    window.addEventListener('touchmove', resetInactivityTimer);
    // Start timer
    resetInactivityTimer();
    return () => {
      window.removeEventListener('mousemove', resetInactivityTimer);
      window.removeEventListener('keydown', resetInactivityTimer);
      window.removeEventListener('touchstart', resetInactivityTimer);
      window.removeEventListener('touchend', resetInactivityTimer);
      window.removeEventListener('touchmove', resetInactivityTimer);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [user]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser = AuthService.getCurrentUser();
        const isAuthenticated = AuthService.isAuthenticated();

        console.log('[AuthContext] Checking session...');
        console.log('[AuthContext] Saved user:', savedUser);
        console.log('[AuthContext] Is authenticated:', isAuthenticated);

        if (savedUser && isAuthenticated) {
          // Validate session with backend
          const isSessionValid = await AuthService.validateSession();
          console.log('[AuthContext] Session valid:', isSessionValid);

          if (isSessionValid) {
            setUser(savedUser);
            // Set auto logout timer and refresh timer if token exists
            const token = AuthService.getAccessToken();
            if (token) {
              const exp = getTokenExpiration(token);
              const now = Date.now();
              const timeout = exp - now;
              if (timeout > 0) {
                if (logoutTimerRef.current)
                  clearTimeout(logoutTimerRef.current);
                logoutTimerRef.current = setTimeout(() => {
                  logout();
                }, timeout);
                scheduleTokenRefresh(token);
              } else {
                logout();
              }
            }
          } else {
            console.log('[AuthContext] Session expired, clearing auth');
            AuthService.clearAuth();
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('[AuthContext] Failed to load user:', err);
        AuthService.clearAuth();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (username, password, rememberMe = false) => {
    setLoading(true);
    setError(null);

    console.log('Login attempt with username:', {
      username,
      password,
      rememberMe,
    });

    try {
      const response = await AuthService.login(username, password, rememberMe);
      console.log('Login successful:', response);

      setUser(response.user);

      // Set auto logout timer and refresh timer
      const token = response.access_token;
      if (token) {
        const exp = getTokenExpiration(token);
        const now = Date.now();
        const timeout = exp - now;
        if (timeout > 0) {
          if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
          logoutTimerRef.current = setTimeout(() => {
            logout();
          }, timeout);
          scheduleTokenRefresh(token);
        } else {
          logout();
        }
      }

      // Redirect based on role
      switch (response.user.user_role) {
        case 'admin':
          localStorage.setItem('adminActiveTab', 'overview');
          localStorage.setItem('adminActiveNav', 'overview');
          window.location.href = '/admin';
          break;
        case 'staff':
          window.location.href = '/staff';
          break;
        case 'client':
          window.location.href = '/client';
          break;
        case 'contractor':
          window.location.href = '/contractor';
          break;
        default:
          window.location.href = '/login';
      }
    } catch (err) {
      console.log('Login error:', err.response?.data);
      const errorMessage =
        err.response?.data?.message ||
        'Login failed. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setShowLogoutWarning(false);
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    try {
      await AuthService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      AuthService.clearAuth();
      window.location.href = '/login';
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
  };

  return (
    <>
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
      <Dialog
        visible={showLogoutWarning}
        header="Session Timeout Warning"
        modal
        onHide={() => {
          // Don't allow closing dialog by clicking outside
        }}
      >
        <p>
          Your session will expire in <strong>{logoutWarningCountdown}</strong>{' '}
          seconds due to inactivity.
        </p>
        <p>Continue using the app to stay logged in.</p>
      </Dialog>
    </>
  );
};
