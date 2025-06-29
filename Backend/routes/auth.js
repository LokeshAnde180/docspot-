// backend/routes/auth.js
// This file defines API routes for user authentication (register, login, get user).

const express = require('express');        // Import Express.js
const router = express.Router();           // Create an Express router
const bcrypt = require('bcryptjs');        // Import bcryptjs for password hashing
const jwt = require('jsonwebtoken');       // Import jsonwebtoken for JWT operations
const config = require('config');          // Import config for accessing jwtSecret
const User = require('../models/User');    // Import the User model
const auth = require('../middleware/auth'); // Import the authentication middleware
const DoctorProfile = require('../models/DoctorProfile'); // Import DoctorProfile for doctor registration logic

// @route   POST api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if user already exists by email or username
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Determine role: if email ends with '@chetan.doctor', set role to 'doctor', else 'customer'
    const role = email.endsWith('@chetan.doctor') ? 'doctor' : 'customer';

    // Create a new user instance
    user = new User({
      username,
      email,
      password,
      role,
      isApproved: role === 'customer' || role === 'admin' ? true : false, // Customers & Admins are approved by default
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);        // Generate a salt
    user.password = await bcrypt.hash(password, salt); // Hash the password with the salt

    // Save user to database
    await user.save();

    // If the user registered as a doctor, create an empty doctor profile for them.
    // This profile will be populated later and approved by an admin.
    if (role === 'doctor') {
      const doctorProfile = new DoctorProfile({
        user: user._id, // Link to the newly created user
        specialty: 'Not specified', // Default value, to be updated by doctor
        isApproved: false // Doctor profiles are initially pending approval
      });
      await doctorProfile.save();
    }

    // Create JWT payload (contains user ID and role)
    const payload = {
      user: {
        id: user.id,   // Mongoose uses 'id' instead of '_id' for the object ID string
        role: user.role,
        username: user.username,
        isApproved: user.isApproved // Include isApproved status
      },
    };

    // Sign the token (create the JWT)
    jwt.sign(
      payload,
      config.get('jwtSecret'), // Use secret from config
      { expiresIn: '1h' },    // Token expires in 1 hour
      (err, token) => {
        if (err) throw err;
        res.json({ token, msg: 'Registration successful!', role: user.role }); // Send token and success message
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // Compare provided password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // Create JWT payload
    const payload = {
      user: {
        id: user.id,
        role: user.role,
        username: user.username,
        isApproved: user.isApproved
      },
    };

    // Sign the token
    jwt.sign(
      payload,
      config.get('jwtSecret'),
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, msg: 'Login successful!', role: user.role, user: payload.user }); // Send token and user info
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/auth/user
// @desc    Get authenticated user data (used to load user on frontend)
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    // Find user by ID from the token, exclude password
    const user = await User.findById(req.user.id).select('-password');
    res.json(user); // Send user data
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; // Export the router
