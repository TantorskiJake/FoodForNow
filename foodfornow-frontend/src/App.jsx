import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AchievementProvider } from './context/AchievementContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ShoppingList from './pages/ShoppingList';
import Pantry from './pages/Pantry';
import Recipes from './pages/Recipes';
import RecipeDetail from './pages/RecipeDetail';
import Ingredients from './pages/Ingredients';
import Achievements from './pages/Achievements';
import { Toaster } from 'react-hot-toast';
import Profile from './pages/Profile';

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center',
          fontFamily: 'Arial, sans-serif'
        }}>
          <h1>Something went wrong</h1>
          <p>Please refresh the page or contact support if the problem persists.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#228B22',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: '20px', textAlign: 'left' }}>
              <summary>Error Details (Development)</summary>
              <pre style={{ 
                background: '#f5f5f5', 
                padding: '10px', 
                borderRadius: '5px',
                overflow: 'auto'
              }}>
                {this.state.error?.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * App Component - Main Application Entry Point
 * 
 * This component sets up the application structure including:
 * - Context providers for authentication and theme
 * - Routing configuration for all pages
 * - Global components like Navbar and Toaster
 * 
 * The app uses a protected route system where most pages require authentication.
 * Public pages (login, register) are accessible without authentication.
 */
function App() {
  return (
    <ErrorBoundary>
      {/* Theme provider for dark/light mode functionality */}
      <ThemeProvider>
        {/* Authentication provider for user state management */}
        <AuthProvider>
          {/* Achievement provider for achievement notifications */}
          <AchievementProvider>
            {/* Router for client-side navigation */}
            <Router>
              {/* Global navigation bar - appears on all pages */}
              <Navbar />
              
              {/* Route definitions for the application */}
              <Routes>
              {/* Public routes - accessible without authentication */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes - require authentication */}
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/shopping-list"
                element={
                  <PrivateRoute>
                    <ShoppingList />
                  </PrivateRoute>
                }
              />
              <Route
                path="/pantry"
                element={
                  <PrivateRoute>
                    <Pantry />
                  </PrivateRoute>
                }
              />
              <Route
                path="/recipes"
                element={
                  <PrivateRoute>
                    <Recipes />
                  </PrivateRoute>
                }
              />
              <Route
                path="/recipes/:id"
                element={
                  <PrivateRoute>
                    <RecipeDetail />
                  </PrivateRoute>
                }
              />
              <Route
                path="/ingredients"
                element={
                  <PrivateRoute>
                    <Ingredients />
                  </PrivateRoute>
                }
              />
              <Route 
                path="/profile" 
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/achievements" 
                element={
                  <PrivateRoute>
                    <Achievements />
                  </PrivateRoute>
                } 
              />
              
              {/* Default route - redirect to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
            
            {/* Global toast notifications */}
            <Toaster position="bottom-right" />
          </Router>
          </AchievementProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
