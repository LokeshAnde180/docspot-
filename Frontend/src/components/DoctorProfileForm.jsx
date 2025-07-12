import React, { useState, useEffect, useContext } from 'react';
import {
  Typography, Box, Button, TextField, CircularProgress, Paper
} from '@mui/material';
import { AuthContext } from '../AuthContext.jsx';
import axios from 'axios';

const DoctorProfileForm = ({ showSnackbar }) => {
  const { API_BASE_URL } = useContext(AuthContext);
  const [specialty, setSpecialty] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/doctor/profile/me`);
        const profile = res.data;
        setSpecialty(profile.specialty || '');
        setClinicName(profile.clinicName || '');
        setAddress(profile.address || '');
        setPhone(profile.phone || '');
        setIsApproved(profile.isApproved);
      } catch (err) {
        console.error('Error fetching doctor profile:', err.response ? err.response.data : err.message);
        if (err.response && err.response.status !== 404) {
          showSnackbar(err.response ? err.response.data.msg : 'Failed to load profile.', 'error');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [API_BASE_URL, showSnackbar]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/doctor/profile`, {
        specialty, clinicName, address, phone
      });
      showSnackbar(res.data.msg, 'success');
      setIsApproved(res.data.profile.isApproved);
    } catch (err) {
      console.error('Error saving doctor profile:', err.response ? err.response.data : err.message);
      showSnackbar(err.response ? err.response.data.msg : 'Failed to save profile.', 'error');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading profile...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>My Profile</Typography>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6">Approval Status:
          <span style={{ color: isApproved ? 'green' : 'red', marginLeft: '8px' }}>
            {isApproved ? 'Approved' : 'Pending Approval'}
          </span>
        </Typography>
        {!isApproved && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Your profile is awaiting approval from the administrator. Once approved, you will be visible to customers for appointments.
          </Typography>
        )}
      </Paper>

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <TextField
          label="Specialty"
          fullWidth
          variant="outlined"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          required
        />
        <TextField
          label="Clinic Name"
          fullWidth
          variant="outlined"
          value={clinicName}
          onChange={(e) => setClinicName(e.target.value)}
        />
        <TextField
          label="Address"
          fullWidth
          variant="outlined"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <TextField
          label="Phone Number"
          fullWidth
          variant="outlined"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          sx={{ mt: 2 }}
        >
          Save Profile
        </Button>
      </Box>
    </Box>
  );
};

export default DoctorProfileForm;
