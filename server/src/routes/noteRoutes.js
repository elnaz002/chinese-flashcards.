/* ============================================================
   Note Routes
   ============================================================ */

const express = require("express");
const router = express.Router();

const {
  saveNote,
  getNote,
  deleteNote,
  getAllNotes,
} = require("../controllers/noteController");

const { protect } = require("../middlewares/authMiddleware");
const { validateObjectId } = require("../middlewares/validateObjectId");
const { writeLimiter } = require("../middlewares/rateLimiter");
const { saveNoteValidator } = require("../middlewares/validators");

router.use(protect);

// All notes
router.get("/", getAllNotes);

// Note for a specific card
router
  .route("/:cardId")
  .post(writeLimiter, saveNoteValidator, saveNote)
  .get(validateObjectId, getNote)
  .delete(writeLimiter, validateObjectId, deleteNote);

module.exports = router;
