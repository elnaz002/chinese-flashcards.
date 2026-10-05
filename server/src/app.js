/* ============================================================
   Express Application
   ============================================================ */

const express = require("express");
const cors = require("cors");
const config = require("./config/env");

const app = express();

// Middlewares
app.use(
  cors({
    origin: config.CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logger (dev)
if (config.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`);
    next();
  });
}

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Chinese Flashcards API is running! 🐼",
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
  });
});

// ============================================================
// TEST Routes (remove in production)
// ============================================================
if (config.NODE_ENV === "development") {
  const { User, Card, Note, QuizResult } = require("./models");

  // Test: list all model names
  app.get("/api/test/models", (req, res) => {
    res.json({
      success: true,
      models: {
        User: User.modelName,
        Card: Card.modelName,
        Note: Note.modelName,
        QuizResult: QuizResult.modelName,
      },
    });
  });

  // Test: create a fake user (for testing only)
  app.get("/api/test/create-user", async (req, res) => {
    try {
      const testUser = new User({
        username: "testuser_" + Date.now(),
        email: `test_${Date.now()}@example.com`,
        password: "password123",
      });

      await testUser.save();

      res.json({
        success: true,
        message: "Test user created!",
        user: testUser,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  });

  // Test: count users
  app.get("/api/test/count-users", async (req, res) => {
    try {
      const count = await User.countDocuments();
      res.json({ success: true, count });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
}

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

module.exports = app;
