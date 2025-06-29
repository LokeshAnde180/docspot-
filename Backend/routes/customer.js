// backend/routes/customer.js
// This file defines API routes specific to Customers.
// These routes are protected and require a user with the 'customer' role.

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Import auth middleware
const User = require('../models/User'); // User model for role checking
const DoctorProfile = require('../models/DoctorProfile'); // DoctorProfile model
const Appointment = require('../models/Appointment'); // Appointment model

// Middleware to ensure user is a customer
const isCustomer = (req, res, next) => {
  // Check if user is a customer OR an admin (admins can technically act as customers for testing)
  if (req.user && (req.user.role === 'customer' || req.user.role === 'admin')) {
    next(); // User is a customer or admin, proceed
  } else {
    res.status(403).json({ msg: 'Access denied, not a customer' }); // Forbidden
  }
};

// @route   GET api/customer/doctors
// @desc    Get a list of all approved doctors
// @access  Private (Customer only)
router.get('/doctors', auth, isCustomer, async (req, res) => {
  try {
    // Find all doctor profiles that are approved
    // Populate the 'user' field to get doctor's username and email
    const doctors = await DoctorProfile.find({ isApproved: true }).populate('user', ['username', 'email']);

    res.json(doctors);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/customer/appointments
// @desc    Book a new appointment
// @access  Private (Customer only)
router.post('/appointments', auth, isCustomer, async (req, res) => {
  const { doctorId, date, time, documents, notes, isEmergency } = req.body;

  try {
    // Check if the doctor exists and is approved
    const doctorProfile = await DoctorProfile.findOne({ user: doctorId });
    if (!doctorProfile || !doctorProfile.isApproved) {
      return res.status(400).json({ msg: 'Doctor not found or not yet approved.' });
    }

    // Create a new appointment
    const newAppointment = new Appointment({
      customer: req.user.id, // Logged-in customer's ID
      doctor: doctorId,      // Doctor's user ID
      date,
      time,
      documents,
      notes,
      isEmergency: isEmergency || false, // Default to false if not provided
      status: 'pending', // New appointments are pending until paid/scheduled by doctor
      paymentStatus: 'pending' // Payment is pending by default
    });

    await newAppointment.save();
    res.status(201).json({ msg: 'Appointment requested successfully! Proceed to "My Appointments" to pay.', appointment: newAppointment });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/customer/appointments/me
// @desc    Get all appointments for the logged-in customer
// @access  Private (Customer only)
router.get('/appointments/me', auth, isCustomer, async (req, res) => {
  try {
    // Find appointments where the customer ID matches the logged-in user's ID
    // Populate 'doctor' field to get doctor's username and email
    const appointments = await Appointment.find({ customer: req.user.id })
      .populate('doctor', ['username', 'email'])
      .sort({ createdAt: -1 }); // Sort by most recent first

    res.json(appointments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/customer/appointments/:id/cancel
// @desc    Cancel an appointment
// @access  Private (Customer only)
router.put('/appointments/:id/cancel', auth, isCustomer, async (req, res) => {
  try {
    let appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ msg: 'Appointment not found' });
    }

    // Ensure the appointment belongs to the logged-in customer
    if (appointment.customer.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to cancel this appointment' });
    }

    // Only allow cancellation if payment is pending or if it hasn't been completed
    if (appointment.status === 'completed') {
      return res.status(400).json({ msg: 'Cannot cancel a completed appointment.' });
    }
    if (appointment.status === 'cancelled') {
        return res.status(400).json({ msg: 'Appointment is already cancelled.' });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    res.json({ msg: 'Appointment cancelled successfully', appointment });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// @route   POST api/customer/appointments/:id/pay
// @desc    Simulate payment for an appointment
// @access  Private (Customer only)
router.post('/appointments/:id/pay', auth, isCustomer, async (req, res) => {
  const { paymentMethod } = req.body; // Mock payment method (e.g., 'upi', 'card')

  try {
    let appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ msg: 'Appointment not found' });
    }

    // Ensure the appointment belongs to the logged-in customer
    if (appointment.customer.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to pay for this appointment' });
    }

    // Only allow payment if status is pending and paymentStatus is pending
    if (appointment.status !== 'pending' && appointment.status !== 'scheduled') {
      return res.status(400).json({ msg: `Cannot pay for an appointment with status: ${appointment.status}` });
    }
    if (appointment.paymentStatus === 'paid') {
      return res.status(400).json({ msg: 'Payment has already been made for this appointment.' });
    }

    // Simulate payment processing
    // In a real application, this would involve a payment gateway API call
    const paymentSuccessful = true; // For demonstration, assume payment always succeeds

    if (paymentSuccessful) {
      appointment.paymentStatus = 'paid';
      // If payment is successful and appointment was pending, it can now be considered scheduled.
      if (appointment.status === 'pending') {
        appointment.status = 'scheduled';
      }
      await appointment.save();
      res.json({ msg: `Payment successful via ${paymentMethod}! Appointment is now ${appointment.status}.`, appointment });
    } else {
      appointment.paymentStatus = 'failed';
      await appointment.save();
      res.status(400).json({ msg: 'Payment failed. Please try again.' });
    }

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


module.exports = router;
