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
          <Route path="/register" component={RegistrationForm} />
          <Route path="/login" component={LoginForm} />
          {/* Add more routes here */}
        </Routes>
      </div>
    </Router>
  );
};

export default App;
