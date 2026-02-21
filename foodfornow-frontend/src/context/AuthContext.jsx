import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';

/**
 * Authentication Context
 * 
 * This context provides authentication state management throughout the application.
 * It handles user authentication status, user data, and provides methods to
 * refresh authentication state.
 */

// Create the authentication context
const AuthContext = createContext();

/**
 * AuthProvider Component
 * 
 * Provides authentication state and methods to all child components.
 * Manages user data, authentication status, and loading states.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to wrap
 */
export const AuthProvider = ({ children }) => {
  // User data state
  const [user, setUser] = useState(null);
  // Authentication status state
  const [authenticated, setAuthenticated] = useState(false);
  // Loading state for authentication checks
  const [loading, setLoading] = useState(true);
  // Ref so a late-running initial refreshAuth() doesn't clear state after login
  const userSetByLoginRef = useRef(false);
  // Flag for login-to-dashboard transition animation (set by Login, read and cleared by Dashboard)
  const [justLoggedIn, setJustLoggedInState] = useState(false);

  /**
   * Refresh Authentication State
   * 
   * Checks the current authentication status by calling the /auth/me endpoint.
   * Updates the user state and authentication status based on the response.
   * This is called on app startup and can be called manually to refresh auth state.
   * @param {Object} options - Optional settings
   * @param {number} options.timeoutMs - If set, treat as unauthenticated after this many ms (stops infinite spinner when backend is down or unreachable).
   */
  const refreshAuth = async (options = {}) => {
    const { timeoutMs = 0 } = options;
    setLoading(true);
    const timedOutRef = { current: false };
    let timeoutId;
    if (timeoutMs > 0) {
      timeoutId = setTimeout(() => {
        timedOutRef.current = true;
        setLoading(false);
        setUser(null);
        setAuthenticated(false);
      }, timeoutMs);
    }
    try {
      const { data } = await api.get('/auth/me');
      if (timedOutRef.current) return;
      setUser(data.user);
      setAuthenticated(true);
      userSetByLoginRef.current = false;
    } catch {
      if (timedOutRef.current) return;
      if (!userSetByLoginRef.current) {
        setUser(null);
        setAuthenticated(false);
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      if (!timedOutRef.current) setLoading(false);
    }
  };

  /**
   * Set auth state from a successful login/register response.
   * Avoids waiting for /auth/me after login (which can hang if cookies
   * aren't applied yet) and redirects immediately.
   */
  const setAuthFromLogin = (userData) => {
    const user = userData ? { ...userData, _id: userData.id || userData._id } : null;
    userSetByLoginRef.current = !!user;
    setUser(user);
    setAuthenticated(!!user);
    setLoading(false);
  };

  /**
   * Logout - Clear local auth state without making API calls.
   * Use this when the user explicitly logs out; the logout API should be
   * called separately to clear server-side session/cookies.
   */
  const logout = () => {
    userSetByLoginRef.current = false;
    setUser(null);
    setAuthenticated(false);
    setLoading(false);
    setJustLoggedInState(false);
  };

  /** Set flag so Dashboard can run entrance animation after login/register. */
  const setJustLoggedIn = () => setJustLoggedInState(true);

  /** Clear flag after dashboard entrance animation completes (so refresh doesn't replay). */
  const clearJustLoggedIn = () => setJustLoggedInState(false);

  // Don't run refreshAuth here – AuthInitializer (inside Router) runs it only when not on login/register
  // so we avoid 401s for /auth/me and /auth/token when the user is on the login page.

  // Provide authentication context to child components
  return (
    <AuthContext.Provider value={{
      user,
      authenticated,
      loading,
      setLoading,
      refreshAuth,
      setAuthFromLogin,
      logout,
      justLoggedIn,
      setJustLoggedIn,
      clearJustLoggedIn,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * AuthInitializer - Runs inside Router. Skips /auth/me on login/register so we don't get 401s in the console.
 * On protected routes, runs refreshAuth so we know if the user is logged in.
 */
export function AuthInitializer({ children }) {
  const { pathname } = useLocation();
  const { setLoading, refreshAuth } = useAuth();

  useEffect(() => {
    const isPublic =
      pathname === '/login' ||
      pathname === '/register' ||
      pathname === '/forgot-password' ||
      pathname === '/reset-password';
    if (isPublic) {
      setLoading(false);
    } else {
      refreshAuth({ timeoutMs: 10000 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return children;
}

/**
 * useAuth Hook
 * 
 * Custom hook to access authentication context.
 * Provides user data, authentication status, loading state, and refresh method.
 * 
 * @returns {Object} Authentication context value
 */
export const useAuth = () => useContext(AuthContext);
