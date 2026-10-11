/* ============================================================
   Card Store (Hybrid Local + Server)
   ============================================================
   Abstracts away WHERE cards are stored:
   - If user is logged in → uses API (server)
   - Otherwise → uses LocalStorage
   ============================================================ */

const CardStore = (function () {
  "use strict";

  // LocalStorage prefix per HSK level
  const LS_PREFIX = "flashcards_hsk_";

  /* ------------------------------------------------------------
       Helpers
       ------------------------------------------------------------ */
  function isLoggedIn() {
    return AuthAPI.isLoggedIn();
  }

  function getLocalKey(level) {
    return LS_PREFIX + (level || 1);
  }

  function loadLocal(level) {
    try {
      const raw = localStorage.getItem(getLocalKey(level));
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Local storage error:", e);
      return [];
    }
  }

  function saveLocal(level, cards) {
    try {
      localStorage.setItem(getLocalKey(level), JSON.stringify(cards));
    } catch (e) {
      console.error("Local storage save error:", e);
    }
  }

  /* ------------------------------------------------------------
       Get all cards
       ------------------------------------------------------------ */
  async function getAll(level, filters = {}) {
    if (isLoggedIn()) {
      // Server mode
      try {
        return await CardsAPI.getAll({ level, ...filters });
      } catch (error) {
        console.error("API error, falling back to local:", error);
        return loadLocal(level);
      }
    } else {
      // Local mode
      return loadLocal(level);
    }
  }

  /* ------------------------------------------------------------
       Create a card
       ------------------------------------------------------------ */
  async function create(level, cardData) {
    if (isLoggedIn()) {
      const card = await CardsAPI.create({ ...cardData, hskLevel: level });
      return card;
    } else {
      // Create locally with a generated ID
      const localCards = loadLocal(level);
      const newCard = {
        id:
          "card_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
        favorite: false,
        tags: [],
        ...cardData,
      };
      localCards.push(newCard);
      saveLocal(level, localCards);
      return newCard;
    }
  }

  /* ------------------------------------------------------------
       Update a card
       ------------------------------------------------------------ */
  async function update(level, cardId, updates) {
    if (isLoggedIn()) {
      return await CardsAPI.update(cardId, updates);
    } else {
      const localCards = loadLocal(level);
      const idx = localCards.findIndex(
        (c) => c.id === cardId || c._id === cardId,
      );
      if (idx === -1) throw new Error("کارت یافت نشد.");
      localCards[idx] = { ...localCards[idx], ...updates };
      saveLocal(level, localCards);
      return localCards[idx];
    }
  }

  /* ------------------------------------------------------------
       Delete a card
       ------------------------------------------------------------ */
  async function remove(level, cardId) {
    if (isLoggedIn()) {
      return await CardsAPI.remove(cardId);
    } else {
      const localCards = loadLocal(level);
      const filtered = localCards.filter(
        (c) => c.id !== cardId && c._id !== cardId,
      );
      saveLocal(level, filtered);
      return { success: true };
    }
  }

  /* ------------------------------------------------------------
       Toggle favorite
       ------------------------------------------------------------ */
  async function toggleFavorite(level, cardId) {
    if (isLoggedIn()) {
      return await CardsAPI.toggleFavorite(cardId);
    } else {
      const localCards = loadLocal(level);
      const idx = localCards.findIndex(
        (c) => c.id === cardId || c._id === cardId,
      );
      if (idx === -1) throw new Error("کارت یافت نشد.");
      localCards[idx].favorite = !localCards[idx].favorite;
      saveLocal(level, localCards);
      return localCards[idx];
    }
  }

  /* ------------------------------------------------------------
       Get distinct tags
       ------------------------------------------------------------ */
  async function getTags(level) {
    if (isLoggedIn()) {
      try {
        return await CardsAPI.getTags();
      } catch (e) {
        const local = loadLocal(level);
        return [...new Set(local.flatMap((c) => c.tags || []))];
      }
    } else {
      const local = loadLocal(level);
      return [...new Set(local.flatMap((c) => c.tags || []))];
    }
  }

  return {
    getAll,
    create,
    update,
    remove,
    toggleFavorite,
    getTags,
  };
})();
