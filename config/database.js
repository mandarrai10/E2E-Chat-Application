require("dotenv").config(); // Load environment variables
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MongoDB URI is undefined. Check your .env file.");
  process.exit(1);
}

exports.connect = async () => {
  try {
    await mongoose.connect(MONGO_URI); // Removed deprecated options
    console.log("✅ Successfully connected to database");
  } catch (error) {
    console.error("❌ Database connection failed. Exiting now...");
    console.error(`Error Message: ${error.message}`);
    
    // Check if it's an authentication error
    if (error.code === 8000) {
      console.error("🚨 Authentication failed. Verify your MongoDB username and password.");
    }

    process.exit(1);
  }
};
