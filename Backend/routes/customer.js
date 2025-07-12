const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const Appointment = require('../models/Appointment');

const isCustomer = (req, res, next) => {
  if (req.user && (req.user.role === 'customer' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ msg: 'Access denied, not a customer' });
  }
};

router.get('/doctors', auth, isCustomer, async (req, res) => {
  try {
    const doctors = await DoctorProfile.find({ isApproved: true }).populate('user', ['username', 'email']);
    res.json(doctors);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.post('/appointments', auth, isCustomer, async (req, res) => {
  const { doctorId, date, time, documents, notes, isEmergency } = req.body;

  try {
    const doctorProfile = await DoctorProfile.findOne({ user: doctorId });
    if (!doctorProfile || !doctorProfile.isApproved) {
      return res.status(400).json({ msg: 'Doctor not found or not yet approved.' });
    }

    const newAppointment = new Appointment({
      customer: req.user.id,
      doctor: doctorId,
      date,
      time,
      documents,
      notes,
      isEmergency: isEmergency || false,
      status: 'pending',
      paymentStatus: 'pending'
    });

    await newAppointment.save();
    res.status(201).json({ msg: 'Appointment requested successfully! Proceed to "My Appointments" to pay.', appointment: newAppointment });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/appointments/me', auth, isCustomer, async (req, res) => {
  try {
    const appointments = await Appointment.find({ customer: req.user.id })
      .populate('doctor', ['username', 'email'])
      .sort({ createdAt: -1 });
    res.json(appointments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.put('/appointments/:id/cancel', auth, isCustomer, async (req, res) => {
  try {
    let appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ msg: 'Appointment not found' });
    }

    if (appointment.customer.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to cancel this appointment' });
    }

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

router.post('/appointments/:id/pay', auth, isCustomer, async (req, res) => {
  const { paymentMethod } = req.body;

  try {
    let appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ msg: 'Appointment not found' });
    }

    if (appointment.customer.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to pay for this appointment' });
    }

    if (appointment.status !== 'pending' && appointment.status !== 'scheduled') {
      return res.status(400).json({ msg: `Cannot pay for an appointment with status: ${appointment.status}` });
    }

    if (appointment.paymentStatus === 'paid') {
      return res.status(400).json({ msg: 'Payment has already been made for this appointment.' });
    }

    const paymentSuccessful = true;

    if (paymentSuccessful) {
      appointment.paymentStatus = 'paid';
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
