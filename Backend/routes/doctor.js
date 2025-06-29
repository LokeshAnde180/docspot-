// backend/routes/doctor.js
// This file defines API routes specific to Doctors.
// These routes are protected and require a user with the 'doctor' role.

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Import auth middleware
const User = require('../models/User'); // User model for role checking
const DoctorProfile = require('../models/DoctorProfile'); // DoctorProfile model
const Appointment = require('../models/Appointment'); // Appointment model

// Middleware to ensure user is a doctor
const isDoctor = (req, res, next) => {
  if (req.user && req.user.role === 'doctor') {
    next(); // User is a doctor, proceed
  } else {
    res.status(403).json({ msg: 'Access denied, not a doctor' }); // Forbidden
  }
};

// @route   POST api/doctor/profile
// @desc    Create or update doctor profile
// @access  Private (Doctor only)
router.post('/profile', auth, isDoctor, async (req, res) => {
  const { specialty, clinicName, address, phone } = req.body;

  try {
    let profile = await DoctorProfile.findOne({ user: req.user.id }); // Find profile by user ID

    if (profile) {
      // Update existing profile
      profile.specialty = specialty;
      profile.clinicName = clinicName;
      profile.address = address;
      profile.phone = phone;
      // isApproved is only set by admin, so it's not updated here by doctor
      await profile.save();
      return res.json({ msg: 'Doctor profile updated', profile });
    }

    // Create new profile if it doesn't exist (though it should exist from registration)
    profile = new DoctorProfile({
      user: req.user.id,
      specialty,
      clinicName,
      address,
      phone,
      isApproved: false // Newly created profiles still need admin approval
    });

    await profile.save();
    res.status(201).json({ msg: 'Doctor profile created', profile });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/doctor/profile/me
// @desc    Get current doctor's profile
// @access  Private (Doctor only)
router.get('/profile/me', auth, isDoctor, async (req, res) => {
  try {
    // Populate the 'user' field to get username and email
    const profile = await DoctorProfile.findOne({ user: req.user.id }).populate('user', ['username', 'email', 'isApproved']);

    if (!profile) {
      return res.status(404).json({ msg: 'Doctor profile not found' });
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/doctor/appointments
// @desc    Get all appointments for the logged-in doctor
// @access  Private (Doctor only)
router.get('/appointments', auth, isDoctor, async (req, res) => {
  try {
    // Find appointments where the doctor ID matches the logged-in user's ID
    // Populate 'customer' field to get customer's username and email
    const appointments = await Appointment.find({ doctor: req.user.id })
      .populate('customer', ['username', 'email'])
      .sort({ date: 1, time: 1 }); // Sort by date then time ascending

    res.json(appointments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/doctor/appointments/:id/status
// @desc    Update an appointment's status (and optionally date/time for reschedule)
// @access  Private (Doctor only)
router.put('/appointments/:id/status', auth, isDoctor, async (req, res) => {
  const { status, date, time } = req.body; // Allow date and time to be updated too
  const appointmentId = req.params.id;

  try {
    let appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ msg: 'Appointment not found' });
    }

    // Ensure the appointment belongs to the logged-in doctor
    if (appointment.doctor.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to update this appointment' });
    }

    // Update status
    if (status) {
      appointment.status = status;
    }
    // Update date and time if provided (for rescheduling)
    if (date) {
      appointment.date = date;
    }
    if (time) {
      appointment.time = time;
    }

    await appointment.save();
    res.json({ msg: 'Appointment updated successfully', appointment });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


module.exports = router;
