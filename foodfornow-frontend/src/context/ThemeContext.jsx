import React, { createContext, useState, useContext, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';

/**
 * Theme Context
 * 
 * This context provides theme management throughout the application.
 * It handles dark/light mode switching and provides Material-UI theme configuration.
 * Theme preferences are persisted in localStorage.
 */

// Create the theme context
const ThemeContext = createContext();

/**
 * useTheme Hook
 * 
 * Custom hook to access theme context.
 * Provides dark mode state and toggle function.
 * 
 * @returns {Object} Theme context value
 */
export const useTheme = () => useContext(ThemeContext);

/**
 * ThemeProvider Component
 * 
 * Provides theme state and Material-UI theme configuration to all child components.
 * Manages dark/light mode switching and theme persistence.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to wrap
 */
export const ThemeProvider = ({ children }) => {
  // Initialize dark mode state from localStorage or default to light mode
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  // Persist theme preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  /**
   * Material-UI Theme Configuration
   * 
   * Defines the visual theme for the application including:
   * - Color palette (primary, secondary, background colors)
   * - Typography settings
   * - Component style overrides
   */
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      // Primary colors (green theme for food/apple)
      primary: {
        main: '#228B22',    // Forest green
        light: '#4caf50',   // Light green
        dark: '#1b5e20',    // Dark green
      },
      // Secondary colors
      secondary: {
        main: '#006400',    // Dark green
        light: '#2e7d32',   // Medium green
        dark: '#004d00',    // Very dark green
      },
      // Background colors for dark/light modes
      background: {
        default: darkMode ? '#121212' : '#f5f5f7', // Dark gray / Light gray
        paper: darkMode ? '#1e1e1e' : '#ffffff',   // Dark gray / White
      },
    },
    // Typography configuration
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    // Component style overrides
    components: {
      // Button styling
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none', // Don't uppercase button text
            borderRadius: 8,       // Rounded corners
          },
        },
      },
      // Paper component styling
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12, // Rounded corners for cards/paper
          },
        },
      },
    },
  });

  /**
   * Toggle Dark Mode
   * 
   * Switches between dark and light mode.
   * The state change triggers a re-render with the new theme.
   */
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  /**
   * Set Theme From User Preferences
   * 
   * Updates the theme based on user's saved preferences.
   * @param {string} themePreference - 'light', 'dark', or 'auto'
   */
  const setThemeFromPreference = (themePreference) => {
    if (themePreference === 'dark') {
      setDarkMode(true);
    } else if (themePreference === 'light') {
      setDarkMode(false);
    } else if (themePreference === 'auto') {
      setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  };

  // Provide theme context and Material-UI theme to child components
  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, setThemeFromPreference }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline /> {/* Reset CSS and apply Material-UI base styles */}
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}; 