// backend/models/Doctor.js
const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true,
    unique: true // A user can only have one doctor profile
  },
  specialty: {
    type: String,
    required: true
  },
  clinicName: {
    type: String
  },
  address: {
    type: String
  },
  phone: {
    type: String
  },
  isApproved: {
    type: Boolean,
    default: false // Doctors are not approved by default
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Doctor', DoctorSchema);
