/* ============================================================
   Note Controller
   ============================================================
   Handles notes (text + drawing) for cards.
   One note per card (unique constraint on cardId).
   ============================================================ */

const { Note, Card } = require("../models");

/* ------------------------------------------------------------
   Helper: check if card exists and belongs to user.
   ------------------------------------------------------------ */
async function findUserCard(cardId, userId) {
  return await Card.findOne({ _id: cardId, userId });
}

/* ------------------------------------------------------------
   @desc    Create or update a note for a card
   @route   POST /api/notes/:cardId
   @access  Private
   ------------------------------------------------------------ */
async function saveNote(req, res, next) {
  try {
    const { cardId } = req.params;

    // Verify the card belongs to this user
    const card = await findUserCard(cardId, req.user._id);
    if (!card) {
      return res.status(404).json({
        success: false,
        message: "کارت یافت نشد یا به شما تعلق ندارد.",
      });
    }

    const { text, canvas, gridSize, styles } = req.body;

    // Build note data
    const noteData = {
      userId: req.user._id,
      cardId: card._id,
      text: text || "",
      canvas: canvas || "",
      gridSize: typeof gridSize === "number" ? gridSize : 20,
      styles: {
        fontFamily: (styles && styles.fontFamily) || "Vazirmatn, sans-serif",
        fontSize: (styles && styles.fontSize) || "18",
        color: (styles && styles.color) || "#1a1a1a",
      },
    };

    // Upsert: find existing or create new
    const note = await Note.findOneAndUpdate({ cardId: card._id }, noteData, {
      new: true, // return updated doc
      upsert: true, // create if not exists
      setDefaultsOnInsert: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: "یادداشت با موفقیت ذخیره شد.",
      data: { note },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(" | "),
      });
    }
    next(error);
  }
}

/* ------------------------------------------------------------
   @desc    Get note for a specific card
   @route   GET /api/notes/:cardId
   @access  Private
   ------------------------------------------------------------ */
async function getNote(req, res, next) {
  try {
    const { cardId } = req.params;

    // Verify card belongs to user
    const card = await findUserCard(cardId, req.user._id);
    if (!card) {
      return res.status(404).json({
        success: false,
        message: "کارت یافت نشد یا به شما تعلق ندارد.",
      });
    }

    const note = await Note.findOne({ cardId: card._id });

    // If no note exists, return an empty structure (client-friendly)
    if (!note) {
      return res.status(200).json({
        success: true,
        data: {
          note: {
            cardId: card._id,
            text: "",
            canvas: "",
            gridSize: 20,
            styles: {
              fontFamily: "Vazirmatn, sans-serif",
              fontSize: "18",
              color: "#1a1a1a",
            },
          },
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: { note },
    });
  } catch (error) {
    next(error);
  }
}

/* ------------------------------------------------------------
   @desc    Delete a note
   @route   DELETE /api/notes/:cardId
   @access  Private
   ------------------------------------------------------------ */
async function deleteNote(req, res, next) {
  try {
    const { cardId } = req.params;

    // Verify card belongs to user
    const card = await findUserCard(cardId, req.user._id);
    if (!card) {
      return res.status(404).json({
        success: false,
        message: "کارت یافت نشد یا به شما تعلق ندارد.",
      });
    }

    const deleted = await Note.findOneAndDelete({ cardId: card._id });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "یادداشتی برای این کارت وجود ندارد.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "یادداشت حذف شد.",
    });
  } catch (error) {
    next(error);
  }
}

/* ------------------------------------------------------------
   @desc    Get all notes for current user
   @route   GET /api/notes
   @access  Private
   ------------------------------------------------------------ */
async function getAllNotes(req, res, next) {
  try {
    const notes = await Note.find({ userId: req.user._id })
      .populate("cardId", "character pinyin meaning hskLevel")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: notes.length,
      data: { notes },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  saveNote,
  getNote,
  deleteNote,
  getAllNotes,
};
