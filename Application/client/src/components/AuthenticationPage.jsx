import React from 'react';
import RegistrationForm from './components/RegistrationForm';
import LoginForm from './components/LoginForm';

const MyPage = () => {
  return (
    <div>
      <h1>Register</h1>
      <RegistrationForm />
      
      <h1>Login</h1>
      <LoginForm />
    </div>
  );
};

export default MyPage;
