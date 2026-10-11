/* ============================================================
   Auth Controller
   ============================================================
   Handles register, login, logout, refresh, and profile.
   ============================================================ */

const { User } = require("../models");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");

/* ------------------------------------------------------------
   Helper: Send tokens + user data in a consistent response.
   ------------------------------------------------------------ */
function sendAuthResponse(res, user, message) {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  return res.status(200).json({
    success: true,
    message,
    data: {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    },
  });
}

/* ------------------------------------------------------------
   @desc    Register a new user
   @route   POST /api/auth/register
   @access  Public
   ------------------------------------------------------------ */
async function register(req, res, next) {
  try {
    const { username, email, password } = req.body;

    // Basic presence check
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "نام کاربری، ایمیل و رمز عبور الزامی است.",
      });
    }

    // Check for duplicate username or email
    const existing = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() },
      ],
    });

    if (existing) {
      const field =
        existing.email === email.toLowerCase() ? "ایمیل" : "نام کاربری";
      return res.status(409).json({
        success: false,
        message: `این ${field} قبلاً استفاده شده است.`,
      });
    }

    // Create user (password is hashed in pre-save hook)
    const user = await User.create({ username, email, password });

    return sendAuthResponse(res, user, "ثبت‌نام با موفقیت انجام شد! 🎉");
  } catch (error) {
    // Mongoose validation error
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(" | "),
      });
    }
    next(error);
  }
}

/* ------------------------------------------------------------
   @desc    Login an existing user
   @route   POST /api/auth/login
   @access  Public
   ------------------------------------------------------------ */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "ایمیل و رمز عبور الزامی است.",
      });
    }

    // Find user (need password field explicitly)
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password",
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "ایمیل یا رمز عبور اشتباه است.",
      });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "ایمیل یا رمز عبور اشتباه است.",
      });
    }

    // Remove password before sending
    user.password = undefined;

    return sendAuthResponse(res, user, "ورود موفقیت‌آمیز! 🎉");
  } catch (error) {
    next(error);
  }
}

/* ------------------------------------------------------------
   @desc    Get current user profile
   @route   GET /api/auth/me
   @access  Private
   ------------------------------------------------------------ */
async function getMe(req, res, next) {
  try {
    // req.user is set by protect middleware
    return res.status(200).json({
      success: true,
      data: { user: req.user.toJSON() },
    });
  } catch (error) {
    next(error);
  }
}

/* ------------------------------------------------------------
   @desc    Refresh access token
   @route   POST /api/auth/refresh
   @access  Public (but needs valid refresh token)
   ------------------------------------------------------------ */
async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token الزامی است.",
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    if (decoded.type !== "refresh") {
      return res.status(401).json({
        success: false,
        message: "نوع توکن نامعتبر است.",
      });
    }

    // Find user
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "کاربر یافت نشد.",
      });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user._id);

    return res.status(200).json({
      success: true,
      message: "توکن با موفقیت تازه‌سازی شد.",
      data: { accessToken: newAccessToken },
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Refresh token منقضی شده است. لطفاً دوباره وارد شوید.",
      });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Refresh token نامعتبر است.",
      });
    }
    next(error);
  }
}

/* ------------------------------------------------------------
   @desc    Logout (client-side only, no server state)
   @route   POST /api/auth/logout
   @access  Private
   ------------------------------------------------------------ */
async function logout(req, res) {
  // Since we use stateless JWT, we simply return success.
  // The client should discard its tokens.
  // In the future: add refresh-token blacklist here.
  return res.status(200).json({
    success: true,
    message: "خروج موفقیت‌آمیز بود.",
  });
}

module.exports = {
  register,
  login,
  getMe,
  refresh,
  logout,
};
