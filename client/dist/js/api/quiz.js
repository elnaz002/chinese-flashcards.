/* ============================================================
   Quiz API Wrapper
   ============================================================
   Frontend wrapper for /api/quiz endpoints.
   ============================================================ */

const QuizAPI = (function () {
  "use strict";

  /* ------------------------------------------------------------
       Save a quiz result
       ------------------------------------------------------------ */
  async function saveResult(resultData) {
    const response = await ApiClient.post(
      CONFIG.ENDPOINTS.QUIZ_RESULTS,
      resultData,
    );
    return response.data.result;
  }

  /* ------------------------------------------------------------
       Get all quiz results
       ------------------------------------------------------------ */
  async function getResults(filters = {}) {
    const params = new URLSearchParams();
    if (filters.level) params.append("level", filters.level);
    if (filters.limit) params.append("limit", filters.limit);

    const query = params.toString();
    const endpoint = CONFIG.ENDPOINTS.QUIZ_RESULTS + (query ? `?${query}` : "");

    const response = await ApiClient.get(endpoint);
    return response.data.results || [];
  }

  /* ------------------------------------------------------------
       Get overall stats
       ------------------------------------------------------------ */
  async function getStats() {
    const response = await ApiClient.get(CONFIG.ENDPOINTS.QUIZ_STATS);
    return response.data;
  }

  /* ------------------------------------------------------------
       Get wrong cards for review
       ------------------------------------------------------------ */
  async function getWrongCards(limit = 20) {
    const response = await ApiClient.get(
      `${CONFIG.ENDPOINTS.QUIZ_WRONG_CARDS}?limit=${limit}`,
    );
    return response.data.wrongCards || [];
  }

  /* ------------------------------------------------------------
       Delete a single result
       ------------------------------------------------------------ */
  async function deleteResult(resultId) {
    return await ApiClient.delete(
      `${CONFIG.ENDPOINTS.QUIZ_RESULTS}/${resultId}`,
    );
  }

  /* ------------------------------------------------------------
       Clear all results
       ------------------------------------------------------------ */
  async function clearAll() {
    return await ApiClient.delete(CONFIG.ENDPOINTS.QUIZ_RESULTS);
  }

  return {
    saveResult,
    getResults,
    getStats,
    getWrongCards,
    deleteResult,
    clearAll,
  };
})();
