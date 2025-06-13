import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../services/api';

const PrivateRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await api.get('/auth/me');
        setAuthenticated(true);
      } catch (err) {
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) return null; // or a spinner
  if (!authenticated) return <Navigate to="/login" replace />;
  return children;
};

export default PrivateRoute;