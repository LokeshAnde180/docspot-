import React, { useState, useEffect, useContext } from 'react';
import {
  Typography, Box, List, ListItem, ListItemText, ListItemSecondaryAction, Button, Divider, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress
} from '@mui/material';
import { AuthContext } from '../AuthContext.jsx';
import axios from 'axios';

const AdminDashboard = ({ showSnackbar }) => {
  const { API_BASE_URL } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    fetchAllUsers();
  }, [API_BASE_URL, showSnackbar]);

  const fetchAllUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/users`);
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err.response ? err.response.data : err.message);
      showSnackbar(err.response ? err.response.data.msg : 'Failed to load users.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDoctor = async (userId) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/admin/doctors/${userId}/approve`);
      showSnackbar(res.data.msg, 'success');
      fetchAllUsers();
    } catch (err) {
      console.error('Error approving doctor:', err.response ? err.response.data : err.message);
      showSnackbar(err.response ? err.response.data.msg : 'Failed to approve doctor.', 'error');
    }
  };

  const handleDeleteUserClick = (user) => {
    setUserToDelete(user);
    setOpenConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
    setUserToDelete(null);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const res = await axios.delete(`${API_BASE_URL}/admin/users/${userToDelete._id}`);
      showSnackbar(res.data.msg, 'success');
      fetchAllUsers();
      handleCloseConfirmDialog();
    } catch (err) {
      console.error('Error deleting user:', err.response ? err.response.data : err.message);
      showSnackbar(err.response ? err.response.data.msg : 'Failed to delete user.', 'error');
      handleCloseConfirmDialog();
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading users...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Admin Dashboard - Manage Users</Typography>
      {users.length === 0 ? (
        <Typography variant="body1">No users found.</Typography>
      ) : (
        <List>
          {users.map((user) => (
            <React.Fragment key={user._id}>
              <ListItem alignItems="flex-start" sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 2, boxShadow: 1 }}>
                <ListItemText
                  primary={
                    <Typography variant="h6" component="div">
                      {user.username} (Role: <Chip label={user.role} size="small" color={user.role === 'admin' ? 'secondary' : user.role === 'doctor' ? 'primary' : 'default'} />)
                    </Typography>
                  }
                  secondary={
                    <React.Fragment>
                      <Typography sx={{ display: 'block' }} component="span" variant="body2" color="text.secondary">
                        Email: {user.email}
                      </Typography>
                      {user.role === 'doctor' && (
                        <Typography sx={{ display: 'block' }} component="span" variant="body2" color="text.secondary">
                          Approval Status: <Chip label={user.isApproved ? 'Approved' : 'Pending'} color={user.isApproved ? 'success' : 'warning'} size="small" />
                        </Typography>
                      )}
                    </React.Fragment>
                  }
                />
                <ListItemSecondaryAction sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {user.role === 'doctor' && !user.isApproved && (
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      onClick={() => handleApproveDoctor(user._id)}
                    >
                      Approve Doctor
                    </Button>
                  )}
                  {user.role !== 'admin' && (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleDeleteUserClick(user)}
                      sx={{ mt: user.role === 'doctor' && !user.isApproved ? 1 : 0 }}
                    >
                      Delete User
                    </Button>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      )}

      <Dialog open={openConfirmDialog} onClose={handleCloseConfirmDialog}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user "{userToDelete?.username}" (Role: {userToDelete?.role})?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;
