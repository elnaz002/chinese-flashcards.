/* ============================================================
   Global Error Handler
   ============================================================
   Central place to handle ALL errors in the app.
   ============================================================ */

const config = require("../config/env");

/**
 * Custom API Error class.
 */
class ApiError extends Error {
  constructor(statusCode, message, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found handler (404).
 */
function notFoundHandler(req, res, next) {
  next(
    new ApiError(
      404,
      `مسیر یافت نشد: ${req.method} ${req.originalUrl}`,
      "NOT_FOUND",
    ),
  );
}

/**
 * Global error handler.
 */
function globalErrorHandler(err, req, res, next) {
  let error = { ...err };
  error.message = err.message;

  // Log to console in dev
  if (config.NODE_ENV === "development") {
    console.error("❌ Error:", {
      message: err.message,
      stack: err.stack,
      path: req.originalUrl,
      method: req.method,
    });
  }

  // ---- Mongoose: Bad ObjectId ----
  if (err.name === "CastError") {
    error = new ApiError(400, "شناسه وارد شده معتبر نیست.", "INVALID_ID");
  }

  // ---- Mongoose: Duplicate key ----
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    const fieldNames = {
      email: "ایمیل",
      username: "نام کاربری",
    };
    error = new ApiError(
      409,
      `این ${fieldNames[field] || field} قبلاً استفاده شده است.`,
      "DUPLICATE_KEY",
    );
  }

  // ---- Mongoose: Validation ----
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    error = new ApiError(400, messages.join(" | "), "VALIDATION_ERROR");
  }

  // ---- JWT errors ----
  if (err.name === "JsonWebTokenError") {
    error = new ApiError(401, "توکن نامعتبر است.", "INVALID_TOKEN");
  }
  if (err.name === "TokenExpiredError") {
    error = new ApiError(401, "توکن منقضی شده است.", "TOKEN_EXPIRED");
  }

  // ---- Multer errors (file upload) ----
  if (err.code === "LIMIT_FILE_SIZE") {
    error = new ApiError(413, "حجم فایل بیش از حد مجاز است.", "FILE_TOO_LARGE");
  }
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    error = new ApiError(400, "فایل غیرمنتظره دریافت شد.", "UNEXPECTED_FILE");
  }

  // ---- Default ----
  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || "خطای داخلی سرور";
  const code = error.code || "INTERNAL_ERROR";

  res.status(statusCode).json({
    success: false,
    message,
    code,
    ...(config.NODE_ENV === "development" && { stack: err.stack }),
  });
}

module.exports = {
  ApiError,
  notFoundHandler,
  globalErrorHandler,
};
