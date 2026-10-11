/* ============================================================
   Cards API Wrapper
   ============================================================
   Frontend wrapper for /api/cards endpoints.
   All methods return the parsed JSON response.
   ============================================================ */

const CardsAPI = (function () {
  "use strict";

  /* ------------------------------------------------------------
       Get all cards (with optional filters)
       ------------------------------------------------------------ */
  async function getAll(filters = {}) {
    const params = new URLSearchParams();

    if (filters.level) params.append("level", filters.level);
    if (filters.tag) params.append("tag", filters.tag);
    if (filters.search) params.append("search", filters.search);
    if (filters.favorite) params.append("favorite", "true");

    const query = params.toString();
    const endpoint = CONFIG.ENDPOINTS.CARDS + (query ? `?${query}` : "");

    const response = await ApiClient.get(endpoint);
    return response.data.cards || [];
  }

  /* ------------------------------------------------------------
       Get one card by ID
       ------------------------------------------------------------ */
  async function getById(cardId) {
    const response = await ApiClient.get(`${CONFIG.ENDPOINTS.CARDS}/${cardId}`);
    return response.data.card;
  }

  /* ------------------------------------------------------------
       Create a new card
       ------------------------------------------------------------ */
  async function create(cardData) {
    const response = await ApiClient.post(CONFIG.ENDPOINTS.CARDS, cardData);
    return response.data.card;
  }

  /* ------------------------------------------------------------
       Update a card
       ------------------------------------------------------------ */
  async function update(cardId, updates) {
    const response = await ApiClient.put(
      `${CONFIG.ENDPOINTS.CARDS}/${cardId}`,
      updates,
    );
    return response.data.card;
  }

  /* ------------------------------------------------------------
       Delete a card
       ------------------------------------------------------------ */
  async function remove(cardId) {
    return await ApiClient.delete(`${CONFIG.ENDPOINTS.CARDS}/${cardId}`);
  }

  /* ------------------------------------------------------------
       Toggle favorite
       ------------------------------------------------------------ */
  async function toggleFavorite(cardId) {
    const response = await ApiClient.patch(
      `${CONFIG.ENDPOINTS.CARDS}/${cardId}/favorite`,
      {},
    );
    return response.data.card;
  }

  /* ------------------------------------------------------------
       Get distinct tags
       ------------------------------------------------------------ */
  async function getTags() {
    const response = await ApiClient.get(CONFIG.ENDPOINTS.CARD_TAGS);
    return response.data.tags || [];
  }

  return {
    getAll,
    getById,
    create,
    update,
    remove,
    toggleFavorite,
    getTags,
  };
})();
