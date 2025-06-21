import React, { createContext, useContext, useEffect, useState } from 'react';
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

  /**
   * Refresh Authentication State
   * 
   * Checks the current authentication status by calling the /auth/me endpoint.
   * Updates the user state and authentication status based on the response.
   * This is called on app startup and can be called manually to refresh auth state.
   */
  const refreshAuth = async () => {
    setLoading(true);
    try {
      // Call the API to get current user information
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      setAuthenticated(true);
    } catch {
      // If the API call fails, user is not authenticated
      setUser(null);
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Check authentication status on component mount
  useEffect(() => {
    refreshAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Provide authentication context to child components
  return (
    <AuthContext.Provider value={{ user, authenticated, loading, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth Hook
 * 
 * Custom hook to access authentication context.
 * Provides user data, authentication status, loading state, and refresh method.
 * 
 * @returns {Object} Authentication context value
 */
export const useAuth = () => useContext(AuthContext);
