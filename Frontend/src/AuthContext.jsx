import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

const API_BASE_URL = 'http://localhost:5000/api';

export const AuthContextProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['x-auth-token'];
      localStorage.removeItem('token');
    }
  };

  const loadUser = async () => {
    if (token) {
      setAuthToken(token);
    } else {
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/auth/user`);
      setUser(res.data);
      setRole(res.data.role);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Error loading user:', err);
      setAuthToken(null);
      setUser(null);
      setRole(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      setToken(res.data.token);
      return res.data;
    } catch (err) {
      console.error('Login failed:', err);
      throw err;
    }
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);
  };

  const authContextValue = {
    token,
    isAuthenticated,
    loading,
    user,
    role,
    login,
    logout,
    loadUser,
    API_BASE_URL
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
