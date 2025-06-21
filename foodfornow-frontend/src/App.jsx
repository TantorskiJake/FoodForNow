import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
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
import { Toaster } from 'react-hot-toast';
import Profile from './pages/Profile';

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
    // Theme provider for dark/light mode functionality
    <ThemeProvider>
      {/* Authentication provider for user state management */}
      <AuthProvider>
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
            
            {/* Default route - redirect to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
          
          {/* Global toast notifications */}
          <Toaster position="bottom-right" />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
