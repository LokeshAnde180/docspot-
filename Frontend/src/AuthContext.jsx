// frontend/src/AuthContext.jsx
// This file sets up a React Context for global authentication state management.
// It provides the current user's authentication status, role, and functions
// for logging in and out to all components wrapped by AuthContextProvider.

import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios'; // For making HTTP requests to the backend

// Create the AuthContext
export const AuthContext = createContext();

// Define the base URL for your backend API
const API_BASE_URL = 'http://localhost:5000/api';

// AuthContextProvider component
export const AuthContextProvider = ({ children }) => {
  // State variables for authentication
  const [token, setToken] = useState(localStorage.getItem('token')); // Get token from localStorage
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Authentication status
  const [loading, setLoading] = useState(true); // Loading state during initial authentication check
  const [user, setUser] = useState(null); // Current user object
  const [role, setRole] = useState(null); // Current user's role

  // Set Authorization header for Axios based on token
  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token; // Set token in default headers
      localStorage.setItem('token', token); // Store token in localStorage
    } else {
      delete axios.defaults.headers.common['x-auth-token']; // Remove token from headers
      localStorage.removeItem('token'); // Remove token from localStorage
    }
  };

  // Function to load user details from the backend using the token
  const loadUser = async () => {
    if (token) {
      setAuthToken(token); // Set the token for subsequent requests
    } else {
      setLoading(false); // No token, stop loading
      return;
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/auth/user`); // Fetch user details
      setUser(res.data); // Set user data
      setRole(res.data.role); // Set user role
      setIsAuthenticated(true); // Set authenticated to true
    } catch (err) {
      console.error('Error loading user:', err);
      setAuthToken(null); // Remove invalid token
      setUser(null);
      setRole(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false); // Loading complete
    }
  };

  // Effect hook to load user when component mounts or token changes
  useEffect(() => {
    loadUser();
  }, [token]); // Depend on token to re-run when token state changes

  // Function to handle user login
  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      setToken(res.data.token); // Store the new token
      // loadUser will be called by the useEffect due to token change
      return res.data; // Return response data (e.g., token, role)
    } catch (err) {
      console.error('Login failed:', err);
      throw err; // Re-throw error for handling in components
    }
  };

  // Function to handle user logout
  const logout = () => {
    setAuthToken(null); // Clear token
    setUser(null); // Clear user data
    setRole(null); // Clear role
    setIsAuthenticated(false); // Set authenticated to false
  };

  // Provide the state and functions through the context value
  const authContextValue = {
    token,
    isAuthenticated,
    loading,
    user,
    role,
    login,
    logout,
    loadUser,
    API_BASE_URL // Also provide API base URL for convenience
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children} {/* Render child components */}
    </AuthContext.Provider>
  );
};
