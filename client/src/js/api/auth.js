/* ============================================================
   Auth API
   ============================================================
   Frontend wrapper for authentication endpoints.
   ============================================================ */

const AuthAPI = (function () {
  "use strict";

  /* ------------------------------------------------------------
       Register a new user
       ------------------------------------------------------------ */
  async function register(username, email, password) {
    const response = await ApiClient.post(
      CONFIG.ENDPOINTS.REGISTER,
      { username, email, password },
      { skipAuth: true },
    );

    // Save tokens + user automatically
    if (response.success && response.data) {
      Storage.setAuth({
        user: response.data.user,
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      });
    }

    return response;
  }

  /* ------------------------------------------------------------
       Login
       ------------------------------------------------------------ */
  async function login(email, password) {
    const response = await ApiClient.post(
      CONFIG.ENDPOINTS.LOGIN,
      { email, password },
      { skipAuth: true },
    );

    if (response.success && response.data) {
      Storage.setAuth({
        user: response.data.user,
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      });
    }

    return response;
  }

  /* ------------------------------------------------------------
       Logout
       ------------------------------------------------------------ */
  async function logout() {
    try {
      // Best-effort: tell the server (server is stateless, but good practice)
      await ApiClient.post(CONFIG.ENDPOINTS.LOGOUT, {});
    } catch (e) {
      console.warn("Logout API error (ignored):", e);
    } finally {
      Storage.clearAuth();
    }
  }

  /* ------------------------------------------------------------
       Get current user (from server)
       ------------------------------------------------------------ */
  async function getMe() {
    const response = await ApiClient.get(CONFIG.ENDPOINTS.ME);

    if (response.success && response.data && response.data.user) {
      Storage.setUser(response.data.user);
    }

    return response;
  }

  /* ------------------------------------------------------------
       Helpers
       ------------------------------------------------------------ */
  function isLoggedIn() {
    return Storage.isLoggedIn();
  }

  function getCurrentUser() {
    return Storage.getUser();
  }

  return {
    register,
    login,
    logout,
    getMe,
    isLoggedIn,
    getCurrentUser,
  };
})();
