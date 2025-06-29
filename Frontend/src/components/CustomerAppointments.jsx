// frontend/src/components/CustomerAppointments.jsx
// This component displays a customer's booked appointments.
// It allows customers to cancel appointments and process mock payments.

import React, { useState, useEffect, useContext } from 'react';
import {
  Typography, Box, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress,
  List, ListItem, ListItemText, ListItemSecondaryAction, Divider, Chip,
  RadioGroup, Radio, FormControlLabel
} from '@mui/material'; // Material UI components
import { AuthContext } from '../AuthContext.jsx'; // Import AuthContext
import axios from 'axios'; // Axios for HTTP requests

// Helper function to format date for display (e.g., "June 24, 2025")
const formatDisplayDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const CustomerAppointments = ({ showSnackbar }) => {
  const { API_BASE_URL } = useContext(AuthContext); // Access API_BASE_URL from AuthContext
  const [appointments, setAppointments] = useState([]); // State to store customer's appointments
  const [loading, setLoading] = useState(true); // Loading state for fetching appointments
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false); // State for payment dialog
  const [selectedAppointment, setSelectedAppointment] = useState(null); // Appointment selected for payment
  const [paymentMethod, setPaymentMethod] = useState('upi'); // State for selected payment method

  // Fetch customer's appointments when the component mounts or dependencies change
  useEffect(() => {
    fetchAppointments();
  }, [API_BASE_URL, showSnackbar]); // Dependencies for useEffect

  const fetchAppointments = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/customer/appointments/me`);
      setAppointments(res.data);
    } catch (err) {
      console.error('Error fetching appointments:', err.response ? err.response.data : err.message);
      showSnackbar(err.response ? err.response.data.msg : 'Failed to load appointments.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helper to get Chip color based on appointment status
  const getStatusChipColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'scheduled': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  // Helper to get Chip color based on payment status
  const getPaymentStatusChipColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'paid': return 'success';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  // Handle appointment cancellation
  const handleCancelAppointment = async (appointmentId) => {
    // Using a simple window.confirm for now, but a custom dialog is recommended for production
    if (window.confirm('Are you sure you want to cancel this appointment? This action cannot be undone if payment has been made.')) {
      try {
        const res = await axios.put(`${API_BASE_URL}/customer/appointments/${appointmentId}/cancel`);
        showSnackbar(res.data.msg, 'success');
        fetchAppointments(); // Refresh appointments list
      } catch (err) {
        console.error('Error cancelling appointment:', err.response ? err.response.data : err.message);
        showSnackbar(err.response ? err.response.data.msg : 'Failed to cancel appointment.', 'error');
      }
    }
  };

  // Open payment dialog
  const handleOpenPaymentDialog = (appointment) => {
    setSelectedAppointment(appointment);
    setOpenPaymentDialog(true);
  };

  // Close payment dialog
  const handleClosePaymentDialog = () => {
    setOpenPaymentDialog(false);
    setSelectedAppointment(null);
    setPaymentMethod('upi'); // Reset payment method
  };

  // Simulate payment processing
  const handleProcessPayment = async () => {
    if (!selectedAppointment) return;

    try {
      const res = await axios.post(`${API_BASE_URL}/customer/appointments/${selectedAppointment._id}/pay`, { paymentMethod });
      showSnackbar(res.data.msg, 'success');
      handleClosePaymentDialog(); // Close dialog
      fetchAppointments(); // Refresh appointments list
    } catch (err) {
      console.error('Error processing payment:', err.response ? err.response.data : err.message);
      showSnackbar(err.response ? err.response.data.msg : 'Payment failed. Please try again.', 'error');
      handleClosePaymentDialog(); // Close dialog even on error
      fetchAppointments(); // Refresh to reflect potential partial updates
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading appointments...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>My Appointments</Typography>
      {appointments.length === 0 ? (
        <Typography variant="body1">You have no appointments booked yet.</Typography>
      ) : (
        <List>
          {appointments.map((appointment) => (
            <React.Fragment key={appointment._id}>
              <ListItem alignItems="flex-start" sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 2, boxShadow: 1 }}>
                <ListItemText
                  primary={
                    <Typography variant="h6" component="div">
                      Appointment with Dr. {appointment.doctor.username} on {formatDisplayDate(appointment.date)} at {appointment.time}
                    </Typography>
                  }
                  secondary={
                    <React.Fragment>
                      <Typography sx={{ display: 'inline' }} component="span" variant="body2" color="text.secondary">
                        Status: <Chip label={appointment.status} color={getStatusChipColor(appointment.status)} size="small" sx={{ ml: 0.5 }} />
                      </Typography>
                      {appointment.isEmergency && (
                        <Chip label="Emergency" color="error" size="small" sx={{ ml: 1 }} />
                      )}
                      <Typography sx={{ display: 'block', mt: 0.5 }} component="span" variant="body2" color="text.secondary">
                        Payment: <Chip label={appointment.paymentStatus} color={getPaymentStatusChipColor(appointment.paymentStatus)} size="small" sx={{ ml: 0.5 }} />
                      </Typography>
                      {appointment.notes && (
                        <Typography sx={{ display: 'block' }} component="span" variant="body2" color="text.secondary">
                          Notes: {appointment.notes}
                        </Typography>
                      )}
                      {appointment.documents && appointment.documents.length > 0 && (
                        <Typography sx={{ display: 'block' }} component="span" variant="body2" color="text.secondary">
                          Documents: {appointment.documents.join(', ')}
                        </Typography>
                      )}
                    </React.Fragment>
                  }
                />
                <ListItemSecondaryAction sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {appointment.paymentStatus === 'pending' && appointment.status !== 'cancelled' && (
                    <Button variant="contained" color="success" size="small" onClick={() => handleOpenPaymentDialog(appointment)}>
                      Pay Now
                    </Button>
                  )}
                  {(appointment.status === 'pending' || appointment.status === 'scheduled') && appointment.paymentStatus !== 'paid' && (
                    <Button variant="outlined" color="error" size="small" onClick={() => handleCancelAppointment(appointment._id)}>
                      Cancel
                    </Button>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      )}

      <Dialog open={openPaymentDialog} onClose={handleClosePaymentDialog} fullWidth maxWidth="xs">
        <DialogTitle>Process Payment</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Appointment with Dr. {selectedAppointment?.doctor?.username} on {formatDisplayDate(selectedAppointment?.date)} at {selectedAppointment?.time}
          </Typography>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Select Payment Method:</Typography>
          <RadioGroup
            aria-label="payment-method"
            name="payment-method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <FormControlLabel value="upi" control={<Radio />} label="UPI (Google Pay, PhonePe, etc.)" />
            <FormControlLabel value="card" control={<Radio />} label="Credit/Debit Card" />
          </RadioGroup>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
            This is a mock payment process for demonstration purposes.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentDialog} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleProcessPayment} variant="contained" color="primary">
            Pay Now
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerAppointments;
