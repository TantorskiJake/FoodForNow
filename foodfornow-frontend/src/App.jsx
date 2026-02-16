import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AchievementProvider } from './context/AchievementContext';
import Navbar from './components/Navbar';
import OnboardingOverlay, { hasCompletedOnboarding } from './components/OnboardingOverlay';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import ShoppingList from './pages/ShoppingList';
import Pantry from './pages/Pantry';
import Recipes from './pages/Recipes';
import RecipeDetail from './pages/RecipeDetail';
import Ingredients from './pages/Ingredients';
import Achievements from './pages/Achievements';
import { Toaster } from 'react-hot-toast';
import Profile from './pages/Profile';
import Scan from './pages/Scan';

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
 * AppRoutes - Renders routes and onboarding overlay when user is authenticated.
 */
function AppRoutes() {
  const { authenticated, user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (authenticated && user?._id && !hasCompletedOnboarding(user._id)) {
      setShowOnboarding(true);
    }
  }, [authenticated, user?._id]);

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
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
        <Route path="/scan" element={<Scan />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
      <Toaster position="bottom-right" />
      {showOnboarding && (
        <OnboardingOverlay
          open={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          userId={user?._id}
        />
      )}
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AchievementProvider>
            <Router>
              <AppRoutes />
            </Router>
          </AchievementProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
