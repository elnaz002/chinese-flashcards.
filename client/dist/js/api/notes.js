/* ============================================================
   Notes API Wrapper
   ============================================================
   Frontend wrapper for /api/notes endpoints.
   ============================================================ */

const NotesAPI = (function () {
  "use strict";

  /* ------------------------------------------------------------
       Get note for a card
       ------------------------------------------------------------ */
  async function getByCard(cardId) {
    const response = await ApiClient.get(`${CONFIG.ENDPOINTS.NOTES}/${cardId}`);
    return response.data.note;
  }

  /* ------------------------------------------------------------
       Save or update note (upsert)
       ------------------------------------------------------------ */
  async function save(cardId, noteData) {
    const response = await ApiClient.post(
      `${CONFIG.ENDPOINTS.NOTES}/${cardId}`,
      noteData,
    );
    return response.data.note;
  }

  /* ------------------------------------------------------------
       Delete note
       ------------------------------------------------------------ */
  async function remove(cardId) {
    return await ApiClient.delete(`${CONFIG.ENDPOINTS.NOTES}/${cardId}`);
  }

  /* ------------------------------------------------------------
       Get all notes
       ------------------------------------------------------------ */
  async function getAll() {
    const response = await ApiClient.get(CONFIG.ENDPOINTS.NOTES);
    return response.data.notes || [];
  }

  return {
    getByCard,
    save,
    remove,
    getAll,
  };
})();
