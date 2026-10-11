/* ============================================================
   API Client
   ============================================================
   A wrapper around fetch() that:
   - Adds JWT access token automatically
   - Handles 401 errors by refreshing the token
   - Parses JSON responses
   - Handles errors in a uniform way
   - Retries the request once after token refresh
   ============================================================ */

const ApiClient = (function () {
  "use strict";

  // Prevent infinite refresh loops
  let isRefreshing = false;
  let refreshPromise = null;

  /* ------------------------------------------------------------
       Fetch wrapper
       ------------------------------------------------------------ */
  async function request(endpoint, options = {}) {
    const url = CONFIG.API_BASE_URL + endpoint;

    // Default headers
    const headers = {
      ...(options.headers || {}),
    };

    // Auto JSON for body if plain object
    if (
      options.body &&
      typeof options.body === "object" &&
      !(options.body instanceof FormData)
    ) {
      headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(options.body);
    }

    // Attach access token (if exists and not explicitly disabled)
    const accessToken = Storage.getAccessToken();
    if (accessToken && !options.skipAuth) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const finalOptions = {
      ...options,
      headers,
    };

    if (CONFIG.DEBUG) {
      console.log(`📡 ${options.method || "GET"} ${endpoint}`);
    }

    try {
      const response = await fetch(url, finalOptions);

      // ---- Handle 401: try to refresh token ----
      if (response.status === 401 && !options.skipAuth && !options._isRetry) {
        const refreshed = await tryRefreshToken();

        if (refreshed) {
          // Retry the original request ONCE
          return request(endpoint, { ...options, _isRetry: true });
        } else {
          // Refresh failed → logout
          Storage.clearAuth();
          window.location.href = "login.html";
          throw new Error("نشست شما منقضی شده است. لطفاً دوباره وارد شوید.");
        }
      }

      // ---- Parse JSON ----
      let data;
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = { success: response.ok, message: await response.text() };
      }

      // ---- Throw for non-2xx ----
      if (!response.ok) {
        const error = new Error(data.message || `HTTP ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        throw new Error(
          "اتصال به سرور برقرار نشد. لطفاً اینترنت خود را بررسی کنید.",
        );
      }
      throw error;
    }
  }

  /* ------------------------------------------------------------
       Try to refresh the access token using refresh token.
       Returns true if successful, false otherwise.
       ------------------------------------------------------------ */
  async function tryRefreshToken() {
    // Prevent concurrent refreshes
    if (isRefreshing) {
      return refreshPromise;
    }

    const refreshToken = Storage.getRefreshToken();
    if (!refreshToken) return false;

    isRefreshing = true;

    refreshPromise = (async () => {
      try {
        const response = await fetch(
          CONFIG.API_BASE_URL + CONFIG.ENDPOINTS.REFRESH,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          },
        );

        if (!response.ok) return false;

        const data = await response.json();
        if (data.success && data.data && data.data.accessToken) {
          Storage.setAccessToken(data.data.accessToken);
          if (CONFIG.DEBUG) console.log("🔄 Token refreshed");
          return true;
        }

        return false;
      } catch (e) {
        console.error("Refresh error:", e);
        return false;
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  }

  /* ------------------------------------------------------------
       Convenience methods
       ------------------------------------------------------------ */
  return {
    get: (endpoint, options = {}) =>
      request(endpoint, { ...options, method: "GET" }),

    post: (endpoint, body, options = {}) =>
      request(endpoint, { ...options, method: "POST", body }),

    put: (endpoint, body, options = {}) =>
      request(endpoint, { ...options, method: "PUT", body }),

    patch: (endpoint, body, options = {}) =>
      request(endpoint, { ...options, method: "PATCH", body }),

    delete: (endpoint, options = {}) =>
      request(endpoint, { ...options, method: "DELETE" }),

    // Raw request (for special cases)
    request,
  };
})();
