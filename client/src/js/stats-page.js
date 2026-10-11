/* ============================================================
   Stats Page Logic
   ============================================================ */

(function () {
  "use strict";

  const statsLoading = document.getElementById("stats-loading");
  const statsContent = document.getElementById("stats-content");
  const toastEl = document.getElementById("toast");

  function showToast(message, isError = false) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.toggle("error", isError);
    toastEl.classList.add("show");
    setTimeout(() => toastEl.classList.remove("show"), 2500);
  }

  function showLoader() {
    statsLoading.style.display = "block";
    statsContent.style.display = "none";
  }

  function hideLoader() {
    statsLoading.style.display = "none";
    statsContent.style.display = "block";
  }

  /* ------------------------------------------------------------
       Render overall stats
       ------------------------------------------------------------ */
  function renderOverall(overall) {
    document.getElementById("stat-total-quizzes").textContent =
      overall.totalQuizzes || 0;
    document.getElementById("stat-average").textContent =
      (overall.averagePercentage || 0) + "%";
    document.getElementById("stat-best").textContent =
      (overall.bestPercentage || 0) + "%";
    document.getElementById("stat-questions").textContent =
      overall.totalQuestions || 0;
  }

  /* ------------------------------------------------------------
       Render level-by-level stats
       ------------------------------------------------------------ */
  function renderByLevel(byLevel) {
    const container = document.getElementById("level-stats");

    if (!byLevel || byLevel.length === 0) {
      container.innerHTML =
        '<p class="no-data">هنوز آزمونی در هیچ سطحی ثبت نشده است.</p>';
      return;
    }

    container.innerHTML = byLevel
      .map(
        (lvl) => `
            <div class="level-stat-row">
                <div class="level-label">HSK ${lvl.hskLevel}</div>
                <div class="level-bar-wrapper">
                    <div class="level-bar" style="width: ${lvl.percentage}%;"></div>
                </div>
                <div class="level-info">
                    <span class="level-percentage">${lvl.percentage}%</span>
                    <span class="level-detail">(${lvl.totalCorrect}/${lvl.totalQuestions})</span>
                </div>
            </div>
        `,
      )
      .join("");
  }

  /* ------------------------------------------------------------
       Render wrong cards
       ------------------------------------------------------------ */
  async function renderWrongCards() {
    const container = document.getElementById("wrong-cards-list");

    try {
      const wrongCards = await QuizStore.getWrongCards(10);

      if (!wrongCards || wrongCards.length === 0) {
        container.innerHTML =
          '<p class="no-data">هنوز کارت اشتباهی ثبت نشده! 🎉</p>';
        return;
      }

      // If wrong cards come from server, they include card info
      // If from local, they only have cardId + wrongCount
      if (wrongCards[0].card) {
        // Server format
        container.innerHTML = wrongCards
          .map(
            (item) => `
                    <div class="wrong-card-item">
                        <div class="wrong-card-char">${item.card.character}</div>
                        <div class="wrong-card-info">
                            <div class="wrong-card-pinyin">${item.card.pinyin}</div>
                            <div class="wrong-card-meaning">${item.card.meaning}</div>
                        </div>
                        <div class="wrong-card-count">${item.wrongCount} بار اشتباه</div>
                    </div>
                `,
          )
          .join("");
      } else {
        // Local format — just show count
        container.innerHTML =
          wrongCards
            .map(
              (item) => `
                    <div class="wrong-card-item">
                        <div class="wrong-card-info">
                            <div class="wrong-card-meaning">${item.wrongCount} بار اشتباه در کارت ${item.cardId.slice(-6)}</div>
                        </div>
                    </div>
                `,
            )
            .join("") +
          '<p class="no-data small">💡 برای دیدن جزئیات، وارد حساب شوید.</p>';
      }
    } catch (error) {
      console.error("Wrong cards error:", error);
      container.innerHTML = '<p class="no-data">خطا در بارگذاری کارت‌ها.</p>';
    }
  }

  /* ------------------------------------------------------------
       Render recent quizzes
       ------------------------------------------------------------ */
  async function renderRecentQuizzes() {
    const container = document.getElementById("recent-quizzes-list");

    try {
      const results = await QuizStore.getResults({ limit: 5 });

      if (!results || results.length === 0) {
        container.innerHTML = '<p class="no-data">هنوز آزمونی ثبت نشده.</p>';
        return;
      }

      const modeLabels = {
        listening: "🎧 شنیداری",
        "char-to-meaning": "🀄 کاراکتر → معنی",
        "meaning-to-char": "📝 معنی → کاراکتر",
        "char-to-pinyin": "🔤 کاراکتر → پینیین",
      };

      container.innerHTML = results
        .map((r) => {
          const pct =
            r.totalQuestions > 0
              ? Math.round((r.correctAnswers / r.totalQuestions) * 100)
              : 0;
          const date = new Date(r.createdAt).toLocaleDateString("fa-IR");
          return `
                    <div class="recent-quiz-item">
                        <div class="recent-quiz-header">
                            <span class="recent-quiz-mode">${modeLabels[r.mode] || r.mode}</span>
                            <span class="recent-quiz-level">HSK ${r.hskLevel}</span>
                        </div>
                        <div class="recent-quiz-score">
                            <span class="${pct >= 70 ? "score-good" : pct >= 50 ? "score-medium" : "score-bad"}">${pct}%</span>
                            <span class="recent-quiz-detail">${r.correctAnswers}/${r.totalQuestions}</span>
                        </div>
                        <div class="recent-quiz-date">${date}</div>
                    </div>
                `;
        })
        .join("");
    } catch (error) {
      console.error("Recent quizzes error:", error);
      container.innerHTML = '<p class="no-data">خطا در بارگذاری آزمون‌ها.</p>';
    }
  }

  /* ------------------------------------------------------------
       Main load
       ------------------------------------------------------------ */
  async function loadStats() {
    showLoader();

    try {
      const stats = await QuizStore.getStats();

      renderOverall(stats.overall);
      renderByLevel(stats.byLevel);
      document.getElementById("recent-count").textContent =
        stats.recentActivity.last7Days || 0;

      await renderWrongCards();
      await renderRecentQuizzes();

      hideLoader();
    } catch (error) {
      console.error("Stats error:", error);
      showToast("خطا در بارگذاری آمار.", true);
      hideLoader();
    }
  }

  /* ------------------------------------------------------------
       Reset button
       ------------------------------------------------------------ */
  const resetBtn = document.getElementById("reset-stats-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", async () => {
      if (
        !confirm(
          "آیا از پاک کردن همه نتایج آزمون مطمئن هستید؟\n\nاین عمل قابل بازگشت نیست!",
        )
      )
        return;
      if (!confirm("یک بار دیگر تایید کنید. همه نتایج حذف می‌شوند.")) return;

      try {
        await QuizStore.clearAll();
        showToast("✅ همه نتایج پاک شد.");
        await loadStats();
      } catch (error) {
        console.error(error);
        showToast("خطا در پاک کردن نتایج.", true);
      }
    });
  }

  /* ------------------------------------------------------------
       Init
       ------------------------------------------------------------ */
  document.addEventListener("DOMContentLoaded", loadStats);
})();
