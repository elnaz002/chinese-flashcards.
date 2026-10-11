/* ============================================================
   Quiz Store (Hybrid Local + Server)
   ============================================================
   Abstracts away WHERE quiz results are stored:
   - If user is logged in → uses API (server)
   - Otherwise → uses LocalStorage
   ============================================================ */

const QuizStore = (function () {
  "use strict";

  const LS_KEY = "quiz_results_local";

  /* ------------------------------------------------------------
       Helpers
       ------------------------------------------------------------ */
  function isLoggedIn() {
    return AuthAPI.isLoggedIn();
  }

  function loadLocal() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Local quiz load error:", e);
      return [];
    }
  }

  function saveLocal(results) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(results));
    } catch (e) {
      console.error("Local quiz save error:", e);
    }
  }

  /* ------------------------------------------------------------
       Save a quiz result
       ------------------------------------------------------------ */
  async function saveResult(resultData) {
    if (isLoggedIn()) {
      try {
        return await QuizAPI.saveResult(resultData);
      } catch (error) {
        console.error("API quiz save error, saving locally:", error);
        return saveResultLocal(resultData);
      }
    } else {
      return saveResultLocal(resultData);
    }
  }

  function saveResultLocal(resultData) {
    const results = loadLocal();
    const newResult = {
      _id:
        "local_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
      ...resultData,
      createdAt: new Date().toISOString(),
      isLocal: true,
    };
    results.unshift(newResult); // newest first
    // Cap at 100 results locally
    if (results.length > 100) results.length = 100;
    saveLocal(results);
    return newResult;
  }

  /* ------------------------------------------------------------
       Get all quiz results
       ------------------------------------------------------------ */
  async function getResults(filters = {}) {
    if (isLoggedIn()) {
      try {
        return await QuizAPI.getResults(filters);
      } catch (error) {
        console.error("API quiz fetch error, using local:", error);
        return loadLocal();
      }
    } else {
      let results = loadLocal();
      if (filters.level) {
        results = results.filter((r) => r.hskLevel === parseInt(filters.level));
      }
      return results;
    }
  }

  /* ------------------------------------------------------------
       Get overall stats
       ------------------------------------------------------------ */
  async function getStats() {
    if (isLoggedIn()) {
      try {
        return await QuizAPI.getStats();
      } catch (error) {
        console.error("API stats error, using local:", error);
        return computeLocalStats();
      }
    } else {
      return computeLocalStats();
    }
  }

  function computeLocalStats() {
    const results = loadLocal();

    if (results.length === 0) {
      return {
        overall: {
          totalQuizzes: 0,
          totalQuestions: 0,
          totalCorrect: 0,
          totalDuration: 0,
          bestPercentage: 0,
          averagePercentage: 0,
        },
        byLevel: [],
        recentActivity: { last7Days: 0 },
        wrongCardsCount: 0,
      };
    }

    // Overall
    let totalQuestions = 0;
    let totalCorrect = 0;
    let totalDuration = 0;
    let bestPercentage = 0;

    results.forEach((r) => {
      totalQuestions += r.totalQuestions || 0;
      totalCorrect += r.correctAnswers || 0;
      totalDuration += r.durationInSeconds || 0;
      const pct =
        r.totalQuestions > 0
          ? Math.round((r.correctAnswers / r.totalQuestions) * 100)
          : 0;
      if (pct > bestPercentage) bestPercentage = pct;
    });

    const overall = {
      totalQuizzes: results.length,
      totalQuestions,
      totalCorrect,
      totalDuration,
      bestPercentage,
      averagePercentage:
        totalQuestions > 0
          ? Math.round((totalCorrect / totalQuestions) * 100)
          : 0,
    };

    // By level
    const levelMap = {};
    results.forEach((r) => {
      const lvl = r.hskLevel || 1;
      if (!levelMap[lvl])
        levelMap[lvl] = { totalQuizzes: 0, totalQuestions: 0, totalCorrect: 0 };
      levelMap[lvl].totalQuizzes++;
      levelMap[lvl].totalQuestions += r.totalQuestions || 0;
      levelMap[lvl].totalCorrect += r.correctAnswers || 0;
    });

    const byLevel = Object.keys(levelMap)
      .sort()
      .map((lvl) => ({
        hskLevel: parseInt(lvl),
        totalQuizzes: levelMap[lvl].totalQuizzes,
        totalQuestions: levelMap[lvl].totalQuestions,
        totalCorrect: levelMap[lvl].totalCorrect,
        percentage:
          levelMap[lvl].totalQuestions > 0
            ? Math.round(
                (levelMap[lvl].totalCorrect / levelMap[lvl].totalQuestions) *
                  100,
              )
            : 0,
      }));

    // Recent (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCount = results.filter(
      (r) => new Date(r.createdAt) >= sevenDaysAgo,
    ).length;

    // Wrong cards count
    const wrongSet = new Set();
    results.forEach((r) =>
      (r.wrongCardIds || []).forEach((id) => wrongSet.add(id)),
    );

    return {
      overall,
      byLevel,
      recentActivity: { last7Days: recentCount },
      wrongCardsCount: wrongSet.size,
    };
  }

  /* ------------------------------------------------------------
       Get wrong cards
       ------------------------------------------------------------ */
  async function getWrongCards(limit = 20) {
    if (isLoggedIn()) {
      try {
        return await QuizAPI.getWrongCards(limit);
      } catch (error) {
        console.error("API wrong-cards error, using local:", error);
        return computeLocalWrongCards(limit);
      }
    } else {
      return computeLocalWrongCards(limit);
    }
  }

  function computeLocalWrongCards(limit) {
    const results = loadLocal();
    const counts = {}; // { cardId: count }

    results.forEach((r) => {
      (r.wrongCardIds || []).forEach((id) => {
        counts[id] = (counts[id] || 0) + 1;
      });
    });

    // Return just IDs + count (limited info locally)
    return Object.keys(counts)
      .map((id) => ({ cardId: id, wrongCount: counts[id] }))
      .sort((a, b) => b.wrongCount - a.wrongCount)
      .slice(0, limit);
  }

  /* ------------------------------------------------------------
       Clear all local results
       ------------------------------------------------------------ */
  async function clearAll() {
    if (isLoggedIn()) {
      try {
        return await QuizAPI.clearAll();
      } catch (error) {
        console.error("API clear error:", error);
        saveLocal([]);
        return { success: true };
      }
    } else {
      saveLocal([]);
      return { success: true };
    }
  }

  return {
    saveResult,
    getResults,
    getStats,
    getWrongCards,
    clearAll,
  };
})();
