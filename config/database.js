const mongoose = require("mongoose");

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed. Exiting now...");
    console.error("Error Message:", error.message);
    process.exit(1);
  }
};

module.exports = { connect };