/* ============================================================
   Auth Routes
   ============================================================ */

const express = require("express");
const router = express.Router();

const {
  register,
  login,
  getMe,
  refresh,
  logout,
} = require("../controllers/authController");

const { protect } = require("../middlewares/authMiddleware");
const { authLimiter } = require("../middlewares/rateLimiter");
const {
  registerValidator,
  loginValidator,
} = require("../middlewares/validators");

// Public routes (with rate limiting + validation)
router.post("/register", authLimiter, registerValidator, register);
router.post("/login", authLimiter, loginValidator, login);
router.post("/refresh", refresh);

// Private routes
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);

module.exports = router;
