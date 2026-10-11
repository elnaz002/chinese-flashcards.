/* ============================================================
   Auth Middleware
   ============================================================
   - protect: requires a valid access token
   ============================================================ */

const { verifyAccessToken } = require("../utils/jwt");
const { User } = require("../models");

/**
 * Protect routes: only accessible with a valid JWT.
 * Attaches `req.user` to the request.
 */
async function protect(req, res, next) {
  try {
    // 1. Extract token from header
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "شما وارد نشده‌اید. لطفاً ابتدا وارد شوید.",
      });
    }

    // 2. Verify token
    const decoded = verifyAccessToken(token);

    if (decoded.type !== "access") {
      return res.status(401).json({
        success: false,
        message: "نوع توکن نامعتبر است.",
      });
    }

    // 3. Find user
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "کاربری با این توکن یافت نشد.",
      });
    }

    // 4. Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "توکن منقضی شده است. لطفاً دوباره وارد شوید.",
        code: "TOKEN_EXPIRED",
      });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "توکن نامعتبر است.",
      });
    }
    next(error);
  }
}

module.exports = { protect };
