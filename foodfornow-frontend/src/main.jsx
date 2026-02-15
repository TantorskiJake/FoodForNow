import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Add error handling for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Add error handling for uncaught errors
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
});

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found. Make sure there is a div with id="root" in your HTML.');
}

const root = createRoot(rootElement);

const element = import.meta.env.DEV ? (
  <StrictMode>
    <App />
  </StrictMode>
) : (
  <App />
);

try {
  root.render(element);
} catch (error) {
  console.error('Failed to render app:', error);
  // Show a fallback UI
  rootElement.innerHTML = `
    <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
      <h1>Failed to load application</h1>
      <p>Please refresh the page or contact support if the problem persists.</p>
      <button onclick="window.location.reload()" style="padding: 10px 20px; background-color: #43a047; color: white; border: none; border-radius: 5px; cursor: pointer;">
        Refresh Page
      </button>
      ${import.meta.env.DEV ? `<details style="margin-top: 20px; text-align: left;"><summary>Error Details (Development)</summary><pre style="background: #f5f5f5; padding: 10px; border-radius: 5px; overflow: auto;">${error.toString()}</pre></details>` : ''}
    </div>
  `;
}
