// frontend/src/components/CustomerDashboard.jsx
// This component is the main dashboard for customers.
// It displays a list of approved doctors and provides a form to book an appointment.

import React, { useState, useEffect, useContext } from 'react';
import {
  Typography, Box, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControlLabel, Checkbox, CircularProgress,
  List, ListItem, ListItemText, ListItemSecondaryAction, Divider
} from '@mui/material'; // Material UI components
import { AuthContext } from '../AuthContext.jsx'; // Import AuthContext
import axios from 'axios'; // Axios for HTTP requests

// Helper function to format date to YYYY-MM-DD (for input type="date")
const formatDateToYYYYMMDD = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const CustomerDashboard = ({ showSnackbar }) => {
  const { API_BASE_URL } = useContext(AuthContext); // Access API_BASE_URL from AuthContext
  const [doctors, setDoctors] = useState([]); // State to store approved doctors
  const [loading, setLoading] = useState(true); // Loading state for fetching doctors
  const [openBookDialog, setOpenBookDialog] = useState(false); // State for appointment booking dialog
  const [selectedDoctor, setSelectedDoctor] = useState(null); // State for the doctor selected for booking

  // Appointment form states
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [documents, setDocuments] = useState(''); // Mock documents field (string for simplicity)
  const [notes, setNotes] = useState('');
  const [isEmergency, setIsEmergency] = useState(false); // State for emergency flag

  // Fetch approved doctors when the component mounts
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/customer/doctors`);
        setDoctors(res.data);
      } catch (err) {
        console.error('Error fetching doctors:', err.response ? err.response.data : err.message);
        showSnackbar(err.response ? err.response.data.msg : 'Failed to load doctors.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, [API_BASE_URL, showSnackbar]); // Dependencies for useEffect

  // Open the appointment booking dialog
  const handleOpenBookDialog = (doctor) => {
    setSelectedDoctor(doctor);
    setOpenBookDialog(true);
  };

  // Close the appointment booking dialog and reset form
  const handleCloseBookDialog = () => {
    setOpenBookDialog(false);
    setSelectedDoctor(null);
    setAppointmentDate('');
    setAppointmentTime('');
    setDocuments('');
    setNotes('');
    setIsEmergency(false);
  };

  // Handle appointment booking submission
  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!selectedDoctor) return;

    try {
      // Send appointment booking request
      const res = await axios.post(`${API_BASE_URL}/customer/appointments`, {
        doctorId: selectedDoctor.user._id,
        date: appointmentDate,
        time: appointmentTime,
        documents,
        notes,
        isEmergency,
      });
      showSnackbar(res.data.msg, 'success');
      handleCloseBookDialog(); // Close dialog on success
      // Note: After booking, the customer will need to go to "My Appointments" to pay and confirm.
    } catch (err) {
      console.error('Error booking appointment:', err.response ? err.response.data : err.message);
      showSnackbar(err.response ? err.response.data.msg : 'Failed to book appointment.', 'error');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading doctors...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Available Doctors</Typography>
      {doctors.length === 0 ? (
        <Typography variant="body1">No approved doctors available at the moment. Please check back later.</Typography>
      ) : (
        <List>
          {doctors.map((doctor) => (
            <React.Fragment key={doctor._id}>
              <ListItem alignItems="flex-start" sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 2, boxShadow: 1 }}>
                <ListItemText
                  primary={
                    <Typography variant="h6" component="div">
                      Dr. {doctor.user.username} ({doctor.specialty})
                    </Typography>
                  }
                  secondary={
                    <React.Fragment>
                      <Typography sx={{ display: 'block' }} component="span" variant="body2" color="text.secondary">
                        Email: {doctor.user.email}
                      </Typography>
                      {doctor.clinicName && (
                        <Typography sx={{ display: 'block' }} component="span" variant="body2" color="text.secondary">
                          Clinic: {doctor.clinicName}
                        </Typography>
                      )}
                      {doctor.address && (
                        <Typography sx={{ display: 'block' }} component="span" variant="body2" color="text.secondary">
                          Address: {doctor.address}
                        </Typography>
                      )}
                      {doctor.phone && (
                        <Typography sx={{ display: 'block' }} component="span" variant="body2" color="text.secondary">
                          Phone: {doctor.phone}
                        </Typography>
                      )}
                    </React.Fragment>
                  }
                />
                <ListItemSecondaryAction>
                  <Button variant="contained" color="primary" onClick={() => handleOpenBookDialog(doctor)}>
                    Book Now
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      )}

      <Dialog open={openBookDialog} onClose={handleCloseBookDialog} fullWidth maxWidth="sm">
        <DialogTitle>Book Appointment with Dr. {selectedDoctor?.user?.username}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleBookAppointment} sx={{ mt: 2 }}>
            <TextField
              label="Date"
              type="date"
              fullWidth
              variant="outlined"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              label="Time"
              type="time"
              fullWidth
              variant="outlined"
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              label="Documents (e.g., Prescription URL)"
              fullWidth
              variant="outlined"
              value={documents}
              onChange={(e) => setDocuments(e.target.value)}
              multiline
              rows={2}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Notes/Symptoms"
              fullWidth
              variant="outlined"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={isEmergency}
                  onChange={(e) => setIsEmergency(e.target.checked)}
                  color="error"
                />
              }
              label={
                <Typography color="error">
                  Mark as Emergency (Doctor's prioritization expected)
                </Typography>
              }
              sx={{ mb: 2 }}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
            >
              Confirm Booking
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBookDialog} color="secondary">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerDashboard;
