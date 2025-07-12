const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); 
const User = require('../models/User'); 
const DoctorProfile = require('../models/DoctorProfile'); 
const Appointment = require('../models/Appointment'); 
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next(); 
  } else {
    res.status(403).json({ msg: 'Access denied, not an admin' }); 
  }
};
router.get('/users', auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.put('/doctors/:user_id/approve', auth, isAdmin, async (req, res) => {
  try {
    let user = await User.findById(req.params.user_id);
    if (!user || user.role !== 'doctor') {
      return res.status(404).json({ msg: 'Doctor not found or not a doctor role' });
    }
    let doctorProfile = await DoctorProfile.findOne({ user: req.params.user_id });
    if (!doctorProfile) {
      return res.status(404).json({ msg: 'Doctor profile not found' });
    }
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
router.delete('/users/:user_id', auth, isAdmin, async (req, res) => {
  try {
    const userToDelete = await User.findById(req.params.user_id);

    if (!userToDelete) {
      return res.status(404).json({ msg: 'User not found' });
    }
    if (userToDelete.role === 'admin') {
        return res.status(403).json({ msg: 'Cannot delete an admin user.' });
    }
    if (userToDelete._id.toString() === req.user.id.toString()) {
        return res.status(403).json({ msg: 'You cannot delete your own account.' });
    }
    if (userToDelete.role === 'doctor') {
      await DoctorProfile.deleteOne({ user: userToDelete._id });
      await Appointment.deleteMany({ doctor: userToDelete._id }); 
    } else if (userToDelete.role === 'customer') {
      await Appointment.deleteMany({ customer: userToDelete._id });
    }
    await userToDelete.deleteOne();

    res.json({ msg: 'User and associated data removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


module.exports = router;
