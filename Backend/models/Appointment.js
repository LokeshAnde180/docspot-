const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: String, 
    required: true,
  },
  time: {
    type: String, 
    required: true,
  },
  documents: {
    type: [String], 
    default: [],
  },
  notes: {
    type: String, 
  },
  isEmergency: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['pending', 'scheduled', 'completed', 'cancelled'], 
    default: 'pending', 
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'], 
    default: 'pending', 
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Appointment', AppointmentSchema); 
