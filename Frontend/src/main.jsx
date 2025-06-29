// frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthContextProvider } from './AuthContext'; // ✅ imported name

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthContextProvider> {/* ✅ match the import name */}
      <App />
    </AuthContextProvider>
  </React.StrictMode>
);
