/* ============================================================
   Constants
   ============================================================
   Central place for application-wide constants.
   ============================================================ */

module.exports = {
  // Rate limiting
  RATE_LIMITS: {
    GLOBAL: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 300, // 300 requests per IP per window
    },
    AUTH: {
      windowMs: 15 * 60 * 1000,
      max: 20, // 20 login/register attempts per 15 min
    },
    WRITE: {
      windowMs: 60 * 1000, // 1 minute
      max: 30, // 30 write requests per minute
    },
  },

  // Body limits
  BODY_LIMITS: {
    JSON: "10mb",
    URLENCODED: "10mb",
    IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5 MB
  },

  // Pagination
  PAGINATION: {
    DEFAULT_LIMIT: 50,
    MAX_LIMIT: 200,
  },
};
