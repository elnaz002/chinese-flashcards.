/* ============================================================
   Express Application (Final)
   ============================================================ */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");

const config = require("./config/env");
const { BODY_LIMITS } = require("./config/constants");
const { globalLimiter } = require("./middlewares/rateLimiter");
const {
  notFoundHandler,
  globalErrorHandler,
} = require("./middlewares/errorHandler");

const app = express();

// ============================================================
// 1. Security & Performance Middlewares
// ============================================================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(compression());

// ============================================================
// 2. CORS
// ============================================================
const allowedOrigins = [
  config.CLIENT_URL,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like Postman, mobile apps)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ============================================================
// 3. Body Parsers
// ============================================================
app.use(express.json({ limit: BODY_LIMITS.JSON }));
app.use(express.urlencoded({ extended: true, limit: BODY_LIMITS.URLENCODED }));

// ============================================================
// 4. Request Logger
// ============================================================
if (config.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// ============================================================
// 5. Rate Limiting (global)
// ============================================================
app.use("/api", globalLimiter);

// ============================================================
// 6. Health Check
// ============================================================
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Chinese Flashcards API is running! 🐼",
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    uptime: Math.round(process.uptime()),
  });
});

// ============================================================
// 7. API Routes
// ============================================================
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/cards", require("./routes/cardRoutes"));
app.use("/api/notes", require("./routes/noteRoutes"));
app.use("/api/quiz", require("./routes/quizRoutes"));

// ============================================================
// 8. 404 + Error Handlers (must be last)
// ============================================================
app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;
