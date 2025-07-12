import React, { useState, useEffect, useContext } from 'react';
import {
  Typography, Box, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress,
  List, ListItem, ListItemText, ListItemSecondaryAction, Divider, Chip,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { AuthContext } from '../AuthContext.js';
import axios from 'axios';

const formatDateToYYYYMMDD = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const DoctorAppointments = ({ showSnackbar }) => {
  const { API_BASE_URL } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openRescheduleDialog, setOpenRescheduleDialog] = useState(false);
  const [currentAppointmentToReschedule, setCurrentAppointmentToReschedule] = useState(null);
  const [newRescheduleDate, setNewRescheduleDate] = useState('');
  const [newRescheduleTime, setNewRescheduleTime] = useState('');

  useEffect(() => {
    fetchDoctorAppointments();
  }, [API_BASE_URL, showSnackbar]);

  const fetchDoctorAppointments = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/doctor/appointments`);
      const sortedAppointments = res.data.sort((a, b) => {
        if (a.isEmergency && !b.isEmergency) return -1;
        if (!a.isEmergency && b.isEmergency) return 1;
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });
      setAppointments(sortedAppointments);
    } catch (err) {
      console.error('Error fetching doctor appointments:', err.response ? err.response.data : err.message);
      showSnackbar(err.response ? err.response.data.msg : 'Failed to load appointments.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusChipColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'scheduled': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPaymentStatusChipColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'paid': return 'success';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/doctor/appointments/${appointmentId}/status`, { status: newStatus });
      showSnackbar(res.data.msg, 'success');
      fetchDoctorAppointments();
    } catch (err) {
      console.error('Error updating appointment status:', err.response ? err.response.data : err.message);
      showSnackbar(err.response ? err.response.data.msg : 'Failed to update status.', 'error');
    }
  };

  const handleOpenRescheduleDialog = (appointment) => {
    setCurrentAppointmentToReschedule(appointment);
    setNewRescheduleDate(formatDateToYYYYMMDD(appointment.date));
    setNewRescheduleTime(appointment.time);
    setOpenRescheduleDialog(true);
  };

  const handleCloseRescheduleDialog = () => {
    setOpenRescheduleDialog(false);
    setCurrentAppointmentToReschedule(null);
    setNewRescheduleDate('');
    setNewRescheduleTime('');
  };

  const handleRescheduleAppointment = async () => {
    if (!currentAppointmentToReschedule) return;

    try {
      const res = await axios.put(`${API_BASE_URL}/doctor/appointments/${currentAppointmentToReschedule._id}/status`, {
        status: 'scheduled',
        date: newRescheduleDate,
        time: newRescheduleTime,
      });
      showSnackbar(`Appointment with ${currentAppointmentToReschedule.customer.username} rescheduled and set to scheduled!`, 'success');
      handleCloseRescheduleDialog();
      fetchDoctorAppointments();
    } catch (err) {
      console.error('Error rescheduling appointment:', err.response ? err.response.data : err.message);
      showSnackbar(err.response ? err.response.data.msg : 'Failed to reschedule appointment.', 'error');
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
        <Typography variant="body1">You have no appointments scheduled yet.</Typography>
      ) : (
        <List>
          {appointments.map((appointment) => (
            <React.Fragment key={appointment._id}>
              <ListItem alignItems="flex-start" sx={{
                mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 2, boxShadow: 1,
                backgroundColor: appointment.isEmergency ? '#ffe0b2' : 'white'
              }}>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center">
                      <Typography variant="h6" component="div">
                        Appointment with {appointment.customer.username} on {formatDisplayDate(appointment.date)} at {appointment.time}
                      </Typography>
                      {appointment.isEmergency && (
                        <Chip label="EMERGENCY" color="error" size="small" sx={{ ml: 1, fontWeight: 'bold' }} />
                      )}
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography sx={{ display: 'inline' }} component="span" variant="body2" color="text.secondary">
                        Status: <Chip label={appointment.status} color={getStatusChipColor(appointment.status)} size="small" sx={{ ml: 0.5 }} />
                      </Typography>
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
                          Documents: {appointment.documents.join(', ') }
                        </Typography>
                      )}
                    </>
                  }
                />
                <ListItemSecondaryAction sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Update Status</InputLabel>
                    <Select
                      value={appointment.status}
                      onChange={(e) => handleStatusChange(appointment._id, e.target.value)}
                      label="Update Status"
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="scheduled">Scheduled</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                  {(appointment.status === 'pending' || appointment.status === 'scheduled') && (
                    <Button
                      variant="outlined"
                      color="info"
                      size="small"
                      onClick={() => handleOpenRescheduleDialog(appointment)}
                      sx={{ mt: 1 }}
                    >
                      Reschedule
                    </Button>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      )}

      <Dialog open={openRescheduleDialog} onClose={handleCloseRescheduleDialog} fullWidth maxWidth="xs">
        <DialogTitle>Reschedule Appointment</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Rescheduling appointment for {currentAppointmentToReschedule?.customer?.username}
          </Typography>
          <TextField
            label="New Date"
            type="date"
            fullWidth
            variant="outlined"
            value={newRescheduleDate}
            onChange={(e) => setNewRescheduleDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            label="New Time"
            type="time"
            fullWidth
            variant="outlined"
            value={newRescheduleTime}
            onChange={(e) => setNewRescheduleTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
            required
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRescheduleDialog} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleRescheduleAppointment} variant="contained" color="primary">
            Confirm Reschedule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DoctorAppointments;
