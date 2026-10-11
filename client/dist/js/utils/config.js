/* ============================================================
   Frontend Configuration
   ============================================================
   Central place for all client-side config.
   ============================================================ */

const CONFIG = {
  // API Base URL
  API_BASE_URL: "http://localhost:5000/api",

  // Local storage keys
  STORAGE_KEYS: {
    ACCESS_TOKEN: "cf_access_token",
    REFRESH_TOKEN: "cf_refresh_token",
    USER: "cf_user",
    THEME: "chinese_app_theme",
  },

  // API endpoints
  ENDPOINTS: {
    // Auth
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    ME: "/auth/me",
    REFRESH: "/auth/refresh",

    // Cards
    CARDS: "/cards",
    CARD_TAGS: "/cards/tags",

    // Notes
    NOTES: "/notes",

    // Quiz
    QUIZ_RESULTS: "/quiz/results",
    QUIZ_STATS: "/quiz/stats",
    QUIZ_WRONG_CARDS: "/quiz/wrong-cards",
  },

  // Timeouts (ms)
  REQUEST_TIMEOUT: 30000,

  // Debug mode
  DEBUG: true,
};

// Freeze to prevent accidental modification
Object.freeze(CONFIG);
