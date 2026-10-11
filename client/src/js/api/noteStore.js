/* ============================================================
   Note Store (Hybrid Local + Server)
   ============================================================
   Abstracts away WHERE notes are stored:
   - If user is logged in → uses API (server)
   - Otherwise → uses LocalStorage
   ============================================================ */

const NoteStore = (function () {
  "use strict";

  const LS_PREFIX = "flashcard_note_";

  /* ------------------------------------------------------------
       Helpers
       ------------------------------------------------------------ */
  function isLoggedIn() {
    return AuthAPI.isLoggedIn();
  }

  function getLsKey(cardId, suffix) {
    return `${LS_PREFIX}${cardId}_${suffix}`;
  }

  function loadLocal(cardId) {
    return {
      text: localStorage.getItem(getLsKey(cardId, "text")) || "",
      canvas: localStorage.getItem(getLsKey(cardId, "canvas")) || "",
      gridSize:
        parseInt(localStorage.getItem(getLsKey(cardId, "gridsize"))) || 20,
      styles: (() => {
        try {
          const raw = localStorage.getItem(getLsKey(cardId, "styles"));
          return raw
            ? JSON.parse(raw)
            : {
                fontFamily: "Vazirmatn, sans-serif",
                fontSize: "18",
                color: "#1a1a1a",
              };
        } catch (e) {
          return {
            fontFamily: "Vazirmatn, sans-serif",
            fontSize: "18",
            color: "#1a1a1a",
          };
        }
      })(),
    };
  }

  function saveLocal(cardId, noteData) {
    try {
      localStorage.setItem(getLsKey(cardId, "text"), noteData.text || "");
      localStorage.setItem(getLsKey(cardId, "canvas"), noteData.canvas || "");
      localStorage.setItem(
        getLsKey(cardId, "gridsize"),
        noteData.gridSize || 20,
      );
      localStorage.setItem(
        getLsKey(cardId, "styles"),
        JSON.stringify(noteData.styles || {}),
      );
    } catch (e) {
      console.error("Local note save error:", e);
    }
  }

  function removeLocal(cardId) {
    localStorage.removeItem(getLsKey(cardId, "text"));
    localStorage.removeItem(getLsKey(cardId, "canvas"));
    localStorage.removeItem(getLsKey(cardId, "gridsize"));
    localStorage.removeItem(getLsKey(cardId, "styles"));
  }

  /* ------------------------------------------------------------
       Get note for a card
       ------------------------------------------------------------ */
  async function get(cardId) {
    if (isLoggedIn()) {
      try {
        const note = await NotesAPI.getByCard(cardId);
        return note;
      } catch (error) {
        console.error("API note error, falling back to local:", error);
        return loadLocal(cardId);
      }
    } else {
      return loadLocal(cardId);
    }
  }

  /* ------------------------------------------------------------
       Save note (upsert)
       ------------------------------------------------------------ */
  async function save(cardId, noteData) {
    // Always save locally too (backup)
    saveLocal(cardId, noteData);

    if (isLoggedIn()) {
      try {
        return await NotesAPI.save(cardId, noteData);
      } catch (error) {
        console.error("API note save error:", error);
        // Local already saved; rethrow? No — allow it to succeed locally
        return { ...noteData, cardId, _localOnly: true };
      }
    } else {
      return { ...noteData, cardId, _localOnly: true };
    }
  }

  /* ------------------------------------------------------------
       Delete note
       ------------------------------------------------------------ */
  async function remove(cardId) {
    removeLocal(cardId);

    if (isLoggedIn()) {
      try {
        return await NotesAPI.remove(cardId);
      } catch (error) {
        console.error("API note delete error:", error);
        return { success: true, _localOnly: true };
      }
    } else {
      return { success: true, _localOnly: true };
    }
  }

  return {
    get,
    save,
    remove,
  };
})();
