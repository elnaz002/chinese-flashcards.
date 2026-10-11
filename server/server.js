/* ============================================================
   Server Entry Point (Final)
   ============================================================ */

const app = require("./src/app");
const config = require("./src/config/env");
const { connectDatabase } = require("./src/config/database");

// Catch uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION! Shutting down...");
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

async function startServer() {
  try {
    // 1. Connect to MongoDB
    await connectDatabase();

    // 2. Start Express server
    const server = app.listen(config.PORT, () => {
      console.log("\n🚀 ================================================");
      console.log("🐼 Chinese Flashcards API (v1.0)");
      console.log("🌍 Environment:", config.NODE_ENV);
      console.log("📡 Server: http://localhost:" + config.PORT);
      console.log("🏥 Health: http://localhost:" + config.PORT + "/api/health");
      console.log("🔒 Security: Helmet + Rate Limiting + CORS");
      console.log("🚀 ================================================\n");
    });

    // Graceful shutdown on SIGTERM
    process.on("SIGTERM", () => {
      console.log("⚠️  SIGTERM received. Shutting down gracefully...");
      server.close(() => {
        console.log("✅ Server closed.");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Catch unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("❌ UNHANDLED REJECTION! Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

startServer();
