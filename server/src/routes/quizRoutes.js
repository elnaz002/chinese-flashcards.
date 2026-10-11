/* ============================================================
   Quiz Routes
   ============================================================ */

const express = require("express");
const router = express.Router();

const {
  saveResult,
  getResults,
  getResultById,
  getStats,
  getWrongCards,
  deleteResult,
  clearAllResults,
} = require("../controllers/quizController");

const { protect } = require("../middlewares/authMiddleware");
const { validateObjectId } = require("../middlewares/validateObjectId");
const { writeLimiter } = require("../middlewares/rateLimiter");
const { saveQuizResultValidator } = require("../middlewares/validators");

router.use(protect);

// Special routes (before /:id)
router.get("/stats", getStats);
router.get("/wrong-cards", getWrongCards);

// Results
router
  .route("/results")
  .post(writeLimiter, saveQuizResultValidator, saveResult)
  .get(getResults)
  .delete(clearAllResults);

// Single result
router
  .route("/results/:id")
  .get(validateObjectId, getResultById)
  .delete(writeLimiter, validateObjectId, deleteResult);

module.exports = router;
