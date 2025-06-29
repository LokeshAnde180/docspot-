// backend/models/Appointment.js
// This file defines the Mongoose schema and model for Appointments.

const mongoose = require('mongoose'); // Import Mongoose

const AppointmentSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId, // Reference to the Customer User
    ref: 'User',
    required: true,
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId, // Reference to the Doctor User
    ref: 'User',
    required: true,
  },
  date: {
    type: String, // Stored as YYYY-MM-DD string for simplicity with HTML date input
    required: true,
  },
  time: {
    type: String, // Stored as HH:mm string for simplicity with HTML time input
    required: true,
  },
  documents: {
    type: [String], // Array of strings (e.g., URLs or descriptions of documents)
    default: [],
  },
  notes: {
    type: String, // Notes/symptoms from the customer
  },
  isEmergency: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['pending', 'scheduled', 'completed', 'cancelled'], // Appointment lifecycle
    default: 'pending', // Initially pending until doctor approves or customer pays
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'], // Payment lifecycle
    default: 'pending', // Initially pending payment
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Appointment', AppointmentSchema); // Export the Appointment model
