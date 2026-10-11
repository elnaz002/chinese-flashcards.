/* ============================================================
   Rate Limiters
   ============================================================
   Protects the API against brute-force and spam.
   ============================================================ */

const rateLimit = require("express-rate-limit");
const { RATE_LIMITS } = require("../config/constants");

/* ------------------------------------------------------------
   Global limiter: applied to the whole /api
   ------------------------------------------------------------ */
const globalLimiter = rateLimit({
  windowMs: RATE_LIMITS.GLOBAL.windowMs,
  max: RATE_LIMITS.GLOBAL.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "تعداد درخواست‌های شما بیش از حد مجاز است. کمی صبر کنید.",
    code: "RATE_LIMIT_EXCEEDED",
  },
});

/* ------------------------------------------------------------
   Auth limiter: applied to /api/auth/login and /register
   ------------------------------------------------------------ */
const authLimiter = rateLimit({
  windowMs: RATE_LIMITS.AUTH.windowMs,
  max: RATE_LIMITS.AUTH.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "تعداد تلاش‌های ورود/ثبت‌نام زیاد است. لطفاً ۱۵ دقیقه صبر کنید.",
    code: "AUTH_RATE_LIMIT",
  },
});

/* ------------------------------------------------------------
   Write limiter: applied to POST/PUT/PATCH/DELETE
   ------------------------------------------------------------ */
const writeLimiter = rateLimit({
  windowMs: RATE_LIMITS.WRITE.windowMs,
  max: RATE_LIMITS.WRITE.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "تعداد درخواست‌های نوشتنی زیاد است. کمی صبر کنید.",
    code: "WRITE_RATE_LIMIT",
  },
});

module.exports = {
  globalLimiter,
  authLimiter,
  writeLimiter,
};
