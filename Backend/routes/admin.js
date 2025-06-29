// backend/routes/admin.js
// This file defines API routes specific to Admin users.
// These routes are protected and require a user with the 'admin' role.

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Import auth middleware
const User = require('../models/User'); // User model
const DoctorProfile = require('../models/DoctorProfile'); // DoctorProfile model
const Appointment = require('../models/Appointment'); // Appointment model

// Middleware to ensure user is an admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next(); // User is an admin, proceed
  } else {
    res.status(403).json({ msg: 'Access denied, not an admin' }); // Forbidden
  }
};

// @route   GET api/admin/users
// @desc    Get all users (for admin dashboard)
// @access  Private (Admin only)
router.get('/users', auth, isAdmin, async (req, res) => {
  try {
    // Find all users, exclude password for security
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/admin/doctors/:user_id/approve
// @desc    Approve a doctor's profile
// @access  Private (Admin only)
router.put('/doctors/:user_id/approve', auth, isAdmin, async (req, res) => {
  try {
    // Find the user by ID and ensure they are a doctor
    let user = await User.findById(req.params.user_id);
    if (!user || user.role !== 'doctor') {
      return res.status(404).json({ msg: 'Doctor not found or not a doctor role' });
    }

    // Find the doctor's profile
    let doctorProfile = await DoctorProfile.findOne({ user: req.params.user_id });
    if (!doctorProfile) {
      return res.status(404).json({ msg: 'Doctor profile not found' });
    }

    // Update isApproved status for both User and DoctorProfile
    user.isApproved = true;
    doctorProfile.isApproved = true;

    await user.save();
    await doctorProfile.save();

    res.json({ msg: 'Doctor approved successfully', user, doctorProfile });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/admin/users/:user_id
// @desc    Delete a user by ID
// @access  Private (Admin only)
router.delete('/users/:user_id', auth, isAdmin, async (req, res) => {
  try {
    // Find the user to be deleted
    const userToDelete = await User.findById(req.params.user_id);

    if (!userToDelete) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Prevent deleting an admin user or self-deletion by an admin (for safety)
    if (userToDelete.role === 'admin') {
        return res.status(403).json({ msg: 'Cannot delete an admin user.' });
    }
    if (userToDelete._id.toString() === req.user.id.toString()) {
        return res.status(403).json({ msg: 'You cannot delete your own account.' });
    }

    // If deleting a doctor, also delete their profile
    if (userToDelete.role === 'doctor') {
      await DoctorProfile.deleteOne({ user: userToDelete._id });
      await Appointment.deleteMany({ doctor: userToDelete._id }); // Delete doctor's appointments
    } else if (userToDelete.role === 'customer') {
      await Appointment.deleteMany({ customer: userToDelete._id }); // Delete customer's appointments
    }

    // Delete the user
    await userToDelete.deleteOne();

    res.json({ msg: 'User and associated data removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


module.exports = router;
