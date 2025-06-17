import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { authenticated, loading } = useAuth();

  if (loading) return null; // or a spinner
  if (!authenticated) return <Navigate to="/login" replace />;
  return children;
};

export default PrivateRoute;