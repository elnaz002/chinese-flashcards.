/* ============================================================
   Theme Manager (Dark / Light Mode)
   ============================================================
   - Reads saved theme from localStorage
   - Toggles theme on button click
   - Updates the toggle icon
   ============================================================ */

(function () {
  "use strict";

  const THEME_KEY = "chinese_app_theme";
  const DARK = "dark";
  const LIGHT = "light";

  /**
   * Apply the given theme to the document body.
   */
  function applyTheme(theme) {
    if (theme === DARK) {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }
    updateIcon(theme);
  }

  /**
   * Updates the theme toggle button icon.
   */
  function updateIcon(theme) {
    const icon = document.querySelector(".theme-icon");
    if (icon) {
      icon.textContent = theme === DARK ? "☀️" : "🌙";
    }
  }

  /**
   * Toggles between light and dark theme.
   */
  function toggleTheme() {
    const current = document.body.classList.contains("dark-theme")
      ? DARK
      : LIGHT;
    const newTheme = current === DARK ? LIGHT : DARK;
    localStorage.setItem(THEME_KEY, newTheme);
    applyTheme(newTheme);
  }

  /**
   * Initialize theme from localStorage (or system preference).
   */
  function initTheme() {
    let saved = localStorage.getItem(THEME_KEY);

    // If no saved theme, detect from system preference
    if (!saved) {
      const prefersDark =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      saved = prefersDark ? DARK : LIGHT;
    }

    applyTheme(saved);

    // Attach click listener to toggle button (if exists)
    const toggleBtn = document.getElementById("theme-toggle");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", toggleTheme);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTheme);
  } else {
    initTheme();
  }
})();
