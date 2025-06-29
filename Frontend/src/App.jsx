// frontend/src/App.jsx
// This is the main application component. It handles the overall layout,
// conditional rendering based on authentication state and user roles,
// and manages global snackbar messages.

import React, { useState, useEffect, useContext } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box, Container, CircularProgress,
  Snackbar, Alert, TextField, FormControlLabel, Checkbox, List, ListItem,
  ListItemText, ListItemSecondaryAction, Divider, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, RadioGroup, Radio, FormControl, InputLabel,
  Select, MenuItem, Paper
} from '@mui/material';
import axios from 'axios';

// Import AuthContext from AuthContext.jsx
import { AuthContext } from './AuthContext.jsx';

// Import components for routing
import AdminDashboard from './components/AdminDashboard.jsx';
import CustomerDashboard from './components/CustomerDashboard.jsx';
import CustomerAppointments from './components/CustomerAppointments.jsx';
import DoctorDashboard from './components/DoctorDashboard.jsx';
import DoctorProfileForm from './components/DoctorProfileForm.jsx';

// Helper function to format date to YYYY-MM-DD (for input type="date")
const formatDateToYYYYMMDD = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to format date for display (e.g., "June 24, 2025")
const formatDisplayDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

// --- AuthForm Component (Kept here for simplicity as it's directly related to App's auth flow) ---
const AuthForm = ({ showSnackbar }) => {
  const [isRegister, setIsRegister] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { login, API_BASE_URL } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isRegister) {
        const res = await axios.post(`${API_BASE_URL}/auth/register`, { username, email, password });
        showSnackbar(res.data.msg + (res.data.role === 'doctor' ? ' (Recognized as Doctor!)' : ''), 'success');
        setIsRegister(false); // Switch to login after successful registration
        setEmail(''); // Clear email and password fields to encourage login
        setPassword('');
      } else {
        await login(email, password);
        showSnackbar('Logged in successfully!', 'success');
      }
    } catch (err) {
      console.error('Authentication Error:', err.response ? err.response.data : err.message);
      showSnackbar(err.response ? err.response.data.msg : 'An unexpected error occurred.', 'error');
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        {isRegister ? 'Register' : 'Login'}
      </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        {isRegister && (
          <TextField
            label="Username"
            variant="outlined"
            fullWidth
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        )}
        <TextField
          label="Email"
          variant="outlined"
          fullWidth
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          label="Password"
          variant="outlined"
          fullWidth
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          sx={{ mt: 2 }}
        >
          {isRegister ? 'Register' : 'Login'}
        </Button>
      </Box>
      <Button
        fullWidth
        variant="text"
        sx={{ mt: 2 }}
        onClick={() => setIsRegister(!isRegister)}
      >
        {isRegister ? 'Already have an account? Login' : 'Need an account? Register'}
      </Button>
    </Box>
  );
};

// --- Navbar Component (Kept here as it's directly related to App's layout and navigation) ---
const Navbar = ({ role, onNavigate }) => {
  const { logout, user } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
  };

  return (
    <AppBar position="static" sx={{ mb: 4 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          DOCSPOT - {role ? role.toUpperCase() : 'Guest'} Portal
        </Typography>
        {user && <Typography variant="subtitle1" sx={{ mr: 2 }}>Welcome, {user.username}</Typography>}

        <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
          {role === 'customer' && (
            <>
              <Button color="inherit" onClick={() => onNavigate('dashboard')}>Book Appointment</Button>
              <Button color="inherit" onClick={() => onNavigate('appointments')}>My Appointments</Button>
            </>
          )}
          {role === 'doctor' && (
            <>
              <Button color="inherit" onClick={() => onNavigate('dashboard')}>My Appointments</Button>
              <Button color="inherit" onClick={() => onNavigate('profile')}>My Profile</Button>
            </>
          )}
          {role === 'admin' && (
            <>
              <Button color="inherit" onClick={() => onNavigate('dashboard')}>Admin Dashboard</Button>
            </>
          )}
        </Box>
        <Button color="inherit" onClick={handleLogout}>Logout</Button>
      </Toolbar>
    </AppBar>
  );
};

// --- Main App Component ---
function App() {
  const { isAuthenticated, user, role, loading, loadUser } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  useEffect(() => {
    // This effect runs once on component mount to try and load user from token
    if (!isAuthenticated && !loading && localStorage.getItem('token')) {
      loadUser();
    }
  }, [isAuthenticated, loading, loadUser]);

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>Loading user data...</Typography>
        </Box>
      );
    }

    if (!isAuthenticated) {
      return (
        <Container maxWidth="sm" sx={{ mt: 4, p: 2, borderRadius: 2, boxShadow: 3, backgroundColor: 'white' }}>
          <AuthForm showSnackbar={showSnackbar} />
        </Container>
      );
    }

    switch (role) {
      case 'customer':
        return (
          <Container maxWidth="lg" sx={{ mt: 4, p: 2, borderRadius: 2, boxShadow: 3, backgroundColor: 'white' }}>
            {currentPage === 'dashboard' && <CustomerDashboard showSnackbar={showSnackbar} />}
            {currentPage === 'appointments' && <CustomerAppointments showSnackbar={showSnackbar} />}
          </Container>
        );
      case 'doctor':
        return (
          <Container maxWidth="lg" sx={{ mt: 4, p: 2, borderRadius: 2, boxShadow: 3, backgroundColor: 'white' }}>
            {currentPage === 'dashboard' && <DoctorDashboard showSnackbar={showSnackbar} />}
            {currentPage === 'profile' && <DoctorProfileForm showSnackbar={showSnackbar} />}
          </Container>
        );
      case 'admin':
        return (
          <Container maxWidth="lg" sx={{ mt: 4, p: 2, borderRadius: 2, boxShadow: 3, backgroundColor: 'white' }}>
            <AdminDashboard showSnackbar={showSnackbar} />
          </Container>
        );
      default:
        return (
          <Typography variant="h6" align="center" sx={{ mt: 4 }}>
            Welcome, {user?.username}! Your role is not recognized or not yet configured.
          </Typography>
        );
    }
  };

  return (
    <Box sx={{ flexGrow: 1, backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      {isAuthenticated && <Navbar role={role} onNavigate={setCurrentPage} />}
      {renderContent()}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default App;
