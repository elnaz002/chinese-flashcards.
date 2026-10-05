/* ============================================================
   Card Model
   ============================================================
   Represents a single Chinese flashcard.
   ============================================================ */

const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // fast lookup by user
    },
    character: {
      type: String,
      required: [true, "Chinese character is required"],
      trim: true,
      maxlength: [50, "Character too long"],
    },
    pinyin: {
      type: String,
      required: [true, "Pinyin is required"],
      trim: true,
      maxlength: [100, "Pinyin too long"],
    },
    meaning: {
      type: String,
      required: [true, "Meaning is required"],
      trim: true,
      maxlength: [200, "Meaning too long"],
    },
    sentence: {
      type: String,
      default: "",
      trim: true,
      maxlength: [300, "Sentence too long"],
    },
    sentencePinyin: {
      type: String,
      default: "",
      trim: true,
      maxlength: [300, "Sentence pinyin too long"],
    },
    sentenceMeaning: {
      type: String,
      default: "",
      trim: true,
      maxlength: [300, "Sentence meaning too long"],
    },
    image: {
      type: String,
      default: "", // Base64 or URL
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (arr) {
          return arr.length <= 10; // max 10 tags
        },
        message: "A card can have at most 10 tags",
      },
    },
    favorite: {
      type: Boolean,
      default: false,
    },
    hskLevel: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
      default: 1,
    },
    // Review tracking (Spaced Repetition - future)
    lastReviewedAt: {
      type: Date,
      default: null,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// ============================================================
// Indexes for faster queries
// ============================================================
cardSchema.index({ userId: 1, hskLevel: 1 });
cardSchema.index({ userId: 1, favorite: 1 });
cardSchema.index({ userId: 1, tags: 1 });

module.exports = mongoose.model("Card", cardSchema);
