// backend/models/DoctorProfile.js
// This file defines the Mongoose schema and model for Doctor Profiles.
// It links to the User model and stores additional doctor-specific information.

const mongoose = require('mongoose'); // Import Mongoose

const DoctorProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId, // Reference to the User model
    ref: 'User', // The model name to which this ID refers
    required: true,
    unique: true, // Each user (doctor) can only have one profile
  },
  specialty: {
    type: String,
    required: true,
  },
  clinicName: {
    type: String,
  },
  address: {
    type: String,
  },
  phone: {
    type: String,
  },
  // This flag will be managed by the admin to approve doctor profiles.
  // It's also duplicated in User model for quick check during user loading.
  isApproved: {
    type: Boolean,
    default: false,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('DoctorProfile', DoctorProfileSchema); // Export the DoctorProfile model
