/* ============================================================
   Storage Utility
   ============================================================
   Handles localStorage for tokens and user data.
   ============================================================ */

const Storage = (function () {
  "use strict";

  const KEYS = {
    ACCESS_TOKEN: "cf_access_token",
    REFRESH_TOKEN: "cf_refresh_token",
    USER: "cf_user",
  };

  /* ---------------- Tokens ---------------- */

  function getAccessToken() {
    return localStorage.getItem(KEYS.ACCESS_TOKEN);
  }

  function setAccessToken(token) {
    if (token) {
      localStorage.setItem(KEYS.ACCESS_TOKEN, token);
    } else {
      localStorage.removeItem(KEYS.ACCESS_TOKEN);
    }
  }

  function getRefreshToken() {
    return localStorage.getItem(KEYS.REFRESH_TOKEN);
  }

  function setRefreshToken(token) {
    if (token) {
      localStorage.setItem(KEYS.REFRESH_TOKEN, token);
    } else {
      localStorage.removeItem(KEYS.REFRESH_TOKEN);
    }
  }

  /* ---------------- User ---------------- */

  function getUser() {
    const raw = localStorage.getItem(KEYS.USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error("Error parsing user:", e);
      return null;
    }
  }

  function setUser(user) {
    if (user) {
      localStorage.setItem(KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(KEYS.USER);
    }
  }

  /* ---------------- Combined helpers ---------------- */

  function setAuth({ user, accessToken, refreshToken }) {
    if (user) setUser(user);
    if (accessToken) setAccessToken(accessToken);
    if (refreshToken) setRefreshToken(refreshToken);
  }

  function clearAuth() {
    localStorage.removeItem(KEYS.ACCESS_TOKEN);
    localStorage.removeItem(KEYS.REFRESH_TOKEN);
    localStorage.removeItem(KEYS.USER);
  }

  function isLoggedIn() {
    return !!getAccessToken();
  }

  /* ---------------- Export ---------------- */

  return {
    getAccessToken,
    setAccessToken,
    getRefreshToken,
    setRefreshToken,
    getUser,
    setUser,
    setAuth,
    clearAuth,
    isLoggedIn,
  };
})();
