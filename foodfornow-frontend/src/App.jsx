import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import RecipeDetail from './pages/RecipeDetail';
import Pantry from './pages/Pantry';
import Recipes from './pages/Recipes';
import Ingredients from './pages/Ingredients';
import ShoppingList from './pages/ShoppingList';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <ThemeProvider>
      <Toaster position="top-right" />
      <Router>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
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
            path="/pantry"
            element={
              <PrivateRoute>
                <Pantry />
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
            path="/recipes"
            element={
              <PrivateRoute>
                <Recipes />
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
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
