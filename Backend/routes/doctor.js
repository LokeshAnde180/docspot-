const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const Appointment = require('../models/Appointment');

const isDoctor = (req, res, next) => {
  if (req.user && req.user.role === 'doctor') {
    next();
  } else {
    res.status(403).json({ msg: 'Access denied, not a doctor' });
  }
};

router.post('/profile', auth, isDoctor, async (req, res) => {
  const { specialty, clinicName, address, phone } = req.body;

  try {
    let profile = await DoctorProfile.findOne({ user: req.user.id });

    if (profile) {
      profile.specialty = specialty;
      profile.clinicName = clinicName;
      profile.address = address;
      profile.phone = phone;
      await profile.save();
      return res.json({ msg: 'Doctor profile updated', profile });
    }

    profile = new DoctorProfile({
      user: req.user.id,
      specialty,
      clinicName,
      address,
      phone,
      isApproved: false
    });

    await profile.save();
    res.status(201).json({ msg: 'Doctor profile created', profile });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/profile/me', auth, isDoctor, async (req, res) => {
  try {
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

router.get('/appointments', auth, isDoctor, async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctor: req.user.id })
      .populate('customer', ['username', 'email'])
      .sort({ date: 1, time: 1 });

    res.json(appointments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.put('/appointments/:id/status', auth, isDoctor, async (req, res) => {
  const { status, date, time } = req.body;
  const appointmentId = req.params.id;

  try {
    let appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ msg: 'Appointment not found' });
    }

    if (appointment.doctor.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to update this appointment' });
    }

    if (status) {
      appointment.status = status;
    }
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
