/* ============================================================
   Card Controller
   ============================================================
   Handles CRUD operations for flashcards.
   All operations are scoped to the authenticated user.
   ============================================================ */

const { Card, Note, User } = require("../models");

/* ------------------------------------------------------------
   @desc    Create a new card
   @route   POST /api/cards
   @access  Private
   ------------------------------------------------------------ */
async function createCard(req, res, next) {
  try {
    const {
      character,
      pinyin,
      meaning,
      sentence,
      sentencePinyin,
      sentenceMeaning,
      image,
      tags,
      hskLevel,
    } = req.body;

    // Basic validation
    if (!character || !pinyin || !meaning) {
      return res.status(400).json({
        success: false,
        message: "کاراکتر، پینیین و معنی الزامی هستند.",
      });
    }

    // Create card
    const card = await Card.create({
      userId: req.user._id,
      character: character.trim(),
      pinyin: pinyin.trim(),
      meaning: meaning.trim(),
      sentence: (sentence || "").trim(),
      sentencePinyin: (sentencePinyin || "").trim(),
      sentenceMeaning: (sentenceMeaning || "").trim(),
      image: image || "",
      tags: Array.isArray(tags) ? tags : [],
      hskLevel: hskLevel || 1,
    });

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { "stats.totalCards": 1 },
    });

    return res.status(201).json({
      success: true,
      message: "کارت با موفقیت ساخته شد! 🎉",
      data: { card },
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
   @desc    Get all cards for current user (with filters)
   @route   GET /api/cards
   @access  Private
   @query   level, tag, search, favorite
   ------------------------------------------------------------ */
async function getCards(req, res, next) {
  try {
    const { level, tag, search, favorite } = req.query;

    // Build filter
    const filter = { userId: req.user._id };

    if (level) filter.hskLevel = parseInt(level, 10);
    if (tag) filter.tags = tag;
    if (favorite === "true") filter.favorite = true;

    if (search) {
      filter.$or = [
        { character: { $regex: search, $options: "i" } },
        { pinyin: { $regex: search, $options: "i" } },
        { meaning: { $regex: search, $options: "i" } },
      ];
    }

    const cards = await Card.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: cards.length,
      data: { cards },
    });
  } catch (error) {
    next(error);
  }
}

/* ------------------------------------------------------------
   @desc    Get a single card by ID
   @route   GET /api/cards/:id
   @access  Private
   ------------------------------------------------------------ */
async function getCard(req, res, next) {
  try {
    const card = await Card.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: "کارت یافت نشد.",
      });
    }

    // Optionally fetch the note
    const note = await Note.findOne({ cardId: card._id });

    return res.status(200).json({
      success: true,
      data: { card, note },
    });
  } catch (error) {
    next(error);
  }
}

/* ------------------------------------------------------------
   @desc    Update a card
   @route   PUT /api/cards/:id
   @access  Private
   ------------------------------------------------------------ */
async function updateCard(req, res, next) {
  try {
    const card = await Card.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: "کارت یافت نشد.",
      });
    }

    // Update only provided fields
    const allowed = [
      "character",
      "pinyin",
      "meaning",
      "sentence",
      "sentencePinyin",
      "sentenceMeaning",
      "image",
      "tags",
      "hskLevel",
    ];

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        card[field] = req.body[field];
      }
    });

    await card.save();

    return res.status(200).json({
      success: true,
      message: "کارت با موفقیت ویرایش شد.",
      data: { card },
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
   @desc    Delete a card (and its note)
   @route   DELETE /api/cards/:id
   @access  Private
   ------------------------------------------------------------ */
async function deleteCard(req, res, next) {
  try {
    const card = await Card.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: "کارت یافت نشد.",
      });
    }

    // Also delete the attached note
    await Note.findOneAndDelete({ cardId: card._id });

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { "stats.totalCards": -1 },
    });

    return res.status(200).json({
      success: true,
      message: "کارت با موفقیت حذف شد.",
      data: { cardId: card._id },
    });
  } catch (error) {
    next(error);
  }
}

/* ------------------------------------------------------------
   @desc    Toggle favorite on a card
   @route   PATCH /api/cards/:id/favorite
   @access  Private
   ------------------------------------------------------------ */
async function toggleFavorite(req, res, next) {
  try {
    const card = await Card.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: "کارت یافت نشد.",
      });
    }

    card.favorite = !card.favorite;
    await card.save();

    return res.status(200).json({
      success: true,
      message: card.favorite ? "به محبوب‌ها اضافه شد ⭐" : "از محبوب‌ها حذف شد",
      data: { card },
    });
  } catch (error) {
    next(error);
  }
}

/* ------------------------------------------------------------
   @desc    Get distinct tags for current user
   @route   GET /api/cards/tags
   @access  Private
   ------------------------------------------------------------ */
async function getTags(req, res, next) {
  try {
    const tags = await Card.distinct("tags", { userId: req.user._id });
    return res.status(200).json({
      success: true,
      data: { tags: tags.sort() },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createCard,
  getCards,
  getCard,
  updateCard,
  deleteCard,
  toggleFavorite,
  getTags,
};
