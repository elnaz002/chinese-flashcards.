/* ============================================================
   Card Routes
   ============================================================ */

const express = require("express");
const router = express.Router();

const {
  createCard,
  getCards,
  getCard,
  updateCard,
  deleteCard,
  toggleFavorite,
  getTags,
} = require("../controllers/cardController");

const { protect } = require("../middlewares/authMiddleware");
const { validateObjectId } = require("../middlewares/validateObjectId");
const { writeLimiter } = require("../middlewares/rateLimiter");
const {
  createCardValidator,
  updateCardValidator,
} = require("../middlewares/validators");

// All card routes require auth
router.use(protect);

// Special routes (before /:id)
router.get("/tags", getTags);

// CRUD
router
  .route("/")
  .post(writeLimiter, createCardValidator, createCard)
  .get(getCards);

router
  .route("/:id")
  .get(validateObjectId, getCard)
  .put(writeLimiter, validateObjectId, updateCardValidator, updateCard)
  .delete(writeLimiter, validateObjectId, deleteCard);

// Toggle favorite
router.patch("/:id/favorite", writeLimiter, validateObjectId, toggleFavorite);

module.exports = router;
