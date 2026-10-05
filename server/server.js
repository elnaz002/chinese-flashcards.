/* ============================================================
   Server Entry Point
   ============================================================ */

const app = require("./src/app");
const config = require("./src/config/env");
const { connectDatabase } = require("./src/config/database");

async function startServer() {
  try {
    // 1. Connect to MongoDB first
    await connectDatabase();

    // 2. Start Express server
    const server = app.listen(config.PORT, () => {
      console.log("\n🚀 ================================================");
      console.log("🐼 Chinese Flashcards API");
      console.log(`🌍 Environment: ${config.NODE_ENV}`);
      console.log(`📡 Server: http://localhost:${config.PORT}`);
      console.log(`🏥 Health: http://localhost:${config.PORT}/api/health`);
      console.log("🚀 ================================================\n");
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      console.log("⚠️  SIGTERM, shutting down...");
      server.close(() => {
        console.log("✅ Server closed");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("❌ Failed to start:", error);
    process.exit(1);
  }
}

startServer();
