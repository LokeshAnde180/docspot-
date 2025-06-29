// backend/server.js
// This is the main entry point for the Express.js backend application.
// It sets up the server, connects to the database, and mounts all API routes.

const express = require('express');        // Import Express.js framework
const dotenv = require('dotenv');          // Import dotenv for environment variables
const connectDB = require('./config/db');  // Import database connection function
const cors = require('cors');              // Import cors for cross-origin requests

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB database
connectDB();

// Initialize the Express application
const app = express();

// Middleware
// Enable CORS for all origins (allows frontend to communicate with backend)
app.use(cors());
// Body parser middleware: allows Express to parse JSON data from request bodies
app.use(express.json());

// Define API Routes
// Authentication routes
app.use('/api/auth', require('./routes/auth'));
// Doctor-specific routes
app.use('/api/doctor', require('./routes/doctor'));
// Customer-specific routes
app.use('/api/customer', require('./routes/customer'));
// Admin-specific routes
app.use('/api/admin', require('./routes/admin'));

// Basic route for testing server status
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Define the port the server will listen on
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
