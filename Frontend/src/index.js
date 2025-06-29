// frontend/src/index.js
// This file is the entry point of the React application.
// It renders the main App component and wraps it with the AuthContextProvider
// to make authentication state available throughout the application.

import React from 'react';
import ReactDOM from 'react-dom/client'; // Import ReactDOM for client-side rendering
import App from './App.jsx'; // Import the main App component
import { AuthContextProvider } from './AuthContext.jsx'; // Import AuthContextProvider from AuthContext.jsx

// Get the root element. If it doesn't exist, create it (defensive measure).
let rootElement = document.getElementById('root');
if (!rootElement) {
  rootElement = document.createElement('div');
  rootElement.id = 'root';
  document.body.appendChild(rootElement);
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {/* Wrap the App component with AuthContextProvider here */}
    <AuthContextProvider>
      <App />
    </AuthContextProvider>
  </React.StrictMode>
);
