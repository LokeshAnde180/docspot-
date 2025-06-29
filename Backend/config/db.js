// backend/config/db.js
// This file handles the connection to the MongoDB database using Mongoose.

const mongoose = require('mongoose'); // Import Mongoose
const config = require('config');     // Import config to get mongoURI

// Function to connect to the database
const connectDB = async () => {
  try {
    // Attempt to connect to MongoDB using the URI from default.json (via config)
    // Both useNewUrlParser and useUnifiedTopology are removed as they are deprecated
    // and have no effect in Node.js Driver version 4.0.0 and above.
    const conn = await mongoose.connect(config.get('mongoURI'));

    console.log(`MongoDB Connected: ${conn.connection.host}`); // Log successful connection
  } catch (err) {
    console.error(`Error: ${err.message}`); // Log any connection errors
    // Exit process with failure.
    // In a production app, you might want more graceful error handling.
    process.exit(1);
  }
};

module.exports = connectDB; // Export the connection function
