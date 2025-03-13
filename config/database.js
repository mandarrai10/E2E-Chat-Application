require("dotenv").config(); // Load environment variables
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MongoDB URI is undefined. Check your .env file.");
  process.exit(1);
}

exports.connect = () => {
  mongoose
    .connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("✅ Successfully connected to database");
    })
    .catch((error) => {
      console.error("❌ Database connection failed. Exiting now...");
      console.error(error);
      process.exit(1);
    });
};
