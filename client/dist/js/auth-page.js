/* ============================================================
   Auth Page Logic
   ============================================================
   Handles tab switching, form submission, and validation
   on the login/register page.
   ============================================================ */

(function () {
  "use strict";

  /* ---------------- DOM Elements ---------------- */
  const tabLogin = document.getElementById("tab-login");
  const tabRegister = document.getElementById("tab-register");
  const tabIndicator = document.getElementById("tab-indicator");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  const loginEmail = document.getElementById("login-email");
  const loginPassword = document.getElementById("login-password");
  const loginSubmit = document.getElementById("login-submit");

  const registerUsername = document.getElementById("register-username");
  const registerEmail = document.getElementById("register-email");
  const registerPassword = document.getElementById("register-password");
  const registerConfirm = document.getElementById("register-confirm");
  const registerSubmit = document.getElementById("register-submit");
  const passwordStrength = document.getElementById("password-strength");

  const switchToRegister = document.getElementById("switch-to-register");
  const switchToLogin = document.getElementById("switch-to-login");
  const toastEl = document.getElementById("toast");

  /* ---------------- Toast ---------------- */
  function showToast(message, isError = false) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.toggle("error", isError);
    toastEl.classList.add("show");
    setTimeout(() => toastEl.classList.remove("show"), 3500);
  }

  /* ---------------- Loading State ---------------- */
  function setLoading(button, isLoading) {
    const btnText = button.querySelector(".btn-text");
    const btnLoader = button.querySelector(".btn-loader");
    button.disabled = isLoading;
    if (isLoading) {
      btnText.classList.add("hidden");
      btnLoader.classList.remove("hidden");
    } else {
      btnText.classList.remove("hidden");
      btnLoader.classList.add("hidden");
    }
  }

  /* ---------------- Tab Switching ---------------- */
  function showLogin() {
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    tabIndicator.classList.remove("right");
    loginForm.classList.add("active");
    registerForm.classList.remove("active");
  }

  function showRegister() {
    tabRegister.classList.add("active");
    tabLogin.classList.remove("active");
    tabIndicator.classList.add("right");
    registerForm.classList.add("active");
    loginForm.classList.remove("active");
  }

  tabLogin.addEventListener("click", showLogin);
  tabRegister.addEventListener("click", showRegister);

  if (switchToRegister) {
    switchToRegister.addEventListener("click", (e) => {
      e.preventDefault();
      showRegister();
    });
  }

  if (switchToLogin) {
    switchToLogin.addEventListener("click", (e) => {
      e.preventDefault();
      showLogin();
    });
  }

  /* ---------------- Show / Hide Password ---------------- */
  document.querySelectorAll(".toggle-password").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;
      if (input.type === "password") {
        input.type = "text";
        btn.textContent = "🙈";
      } else {
        input.type = "password";
        btn.textContent = "👁️";
      }
    });
  });

  /* ---------------- Password Strength ---------------- */
  if (registerPassword) {
    registerPassword.addEventListener("input", () => {
      const val = registerPassword.value;
      let strength = "weak";
      if (val.length >= 8 && /[A-Z]/.test(val) && /[0-9]/.test(val)) {
        strength = "strong";
      } else if (val.length >= 6) {
        strength = "medium";
      }
      passwordStrength.classList.remove("weak", "medium", "strong");
      if (val.length > 0) {
        passwordStrength.classList.add(strength);
      }
    });
  }

  /* ---------------- Login Submit ---------------- */
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email || !password) {
      showToast("ایمیل و رمز عبور را وارد کنید.", true);
      return;
    }

    setLoading(loginSubmit, true);

    try {
      const response = await AuthAPI.login(email, password);

      if (response.success) {
        showToast("🎉 ورود موفق! در حال انتقال...", false);
        setTimeout(() => {
          window.location.href = "index.html";
        }, 800);
      } else {
        showToast(response.message || "خطا در ورود.", true);
      }
    } catch (error) {
      showToast(error.message || "خطا در ورود.", true);
      console.error(error);
    } finally {
      setLoading(loginSubmit, false);
    }
  });

  /* ---------------- Register Submit ---------------- */
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = registerUsername.value.trim();
    const email = registerEmail.value.trim();
    const password = registerPassword.value;
    const confirm = registerConfirm.value;

    // Validation
    if (!username || !email || !password || !confirm) {
      showToast("همه فیلدها را پر کنید.", true);
      return;
    }

    if (username.length < 3) {
      showToast("نام کاربری باید حداقل ۳ کاراکتر باشد.", true);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      showToast("نام کاربری فقط حروف، اعداد و _ می‌تواند باشد.", true);
      return;
    }

    if (password.length < 6) {
      showToast("رمز عبور باید حداقل ۶ کاراکتر باشد.", true);
      return;
    }

    if (password !== confirm) {
      showToast("رمز عبور و تکرار آن یکسان نیستند.", true);
      return;
    }

    setLoading(registerSubmit, true);

    try {
      const response = await AuthAPI.register(username, email, password);

      if (response.success) {
        showToast("🎉 ثبت‌نام موفق! در حال انتقال...", false);
        setTimeout(() => {
          window.location.href = "index.html";
        }, 800);
      } else {
        showToast(response.message || "خطا در ثبت‌نام.", true);
      }
    } catch (error) {
      showToast(error.message || "خطا در ثبت‌نام.", true);
      console.error(error);
    } finally {
      setLoading(registerSubmit, false);
    }
  });

  /* ---------------- Check if already logged in ---------------- */
  document.addEventListener("DOMContentLoaded", () => {
    if (AuthAPI.isLoggedIn()) {
      window.location.href = "index.html";
    }
  });
})();
