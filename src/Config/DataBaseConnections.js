require("dotenv").config();
const mongoose = require("mongoose");

const DataBaseConnections = () => {
  mongoose.set("strictQuery", false);
  // MongoDB Connection
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MongoDB connection error:", err));
};

module.exports = {
  DataBaseConnections,
};
