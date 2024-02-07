import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import RegistrationForm from './components/RegistrationForm';
import LoginForm from './components/LoginForm';
import './index.css';

const App = () => {
  return (
    <Router>
      <div>
        <Routes>
          {/* Route for RegistrationForm */}
          <Route path="/register" element={<RegistrationForm />} />

          {/* Route for LoginForm */}
          <Route path="/login" element={<LoginForm />} />

          {/* Add more routes here if needed */}
        </Routes>
      </div>
    </Router>
  );
};

export default App;
