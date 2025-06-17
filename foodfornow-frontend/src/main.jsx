import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

const element = import.meta.env.DEV ? (
  <StrictMode>
    <App />
  </StrictMode>
) : (
  <App />
);

root.render(element);
