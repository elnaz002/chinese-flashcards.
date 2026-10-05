/* ============================================================
   MongoDB Connection (Mongoose)
   ============================================================ */

const mongoose = require("mongoose");
const config = require("./env");

async function connectDatabase() {
  try {
    console.log("🔄 Connecting to MongoDB...");

    await mongoose.connect(config.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("✅ MongoDB connected!");
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(
      `🌍 Host: ${mongoose.connection.host}:${mongoose.connection.port}`,
    );

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB error:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB disconnected");
    });
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

module.exports = { connectDatabase };
