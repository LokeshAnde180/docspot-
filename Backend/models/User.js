// backend/models/User.js
// This file defines the Mongoose schema and model for the User.

const mongoose = require('mongoose'); // Import Mongoose

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true, // Ensure usernames are unique
  },
  email: {
    type: String,
    required: true,
    unique: true, // Ensure emails are unique
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['customer', 'doctor', 'admin'], // Enforce specific roles
    default: 'customer', // Default role for new users
  },
  // For doctors, this flag indicates if their profile is approved by an admin
  isApproved: {
    type: Boolean,
    default: false, // Doctors are not approved by default
  },
  date: {
    type: Date,
    default: Date.now, // Automatically set creation date
  },
});

module.exports = mongoose.model('User', UserSchema); // Export the User model
