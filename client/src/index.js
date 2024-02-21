import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

// Change the import to import createRoot from 'react-dom/client'
import { createRoot } from 'react-dom/client';

// Render the root using createRoot
createRoot(document.getElementById('root')).render(<App />);
