/* ============================================================
   QuizResult Model
   ============================================================
   Stores the result of a completed quiz session.
   ============================================================ */

const mongoose = require("mongoose");

const quizResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    hskLevel: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
    },
    mode: {
      type: String,
      required: true,
      enum: [
        "listening",
        "char-to-meaning",
        "meaning-to-char",
        "char-to-pinyin",
      ],
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 1,
    },
    correctAnswers: {
      type: Number,
      required: true,
      min: 0,
    },
    // Cards answered incorrectly (for later review)
    wrongCardIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Card",
      },
    ],
    // Time spent in seconds
    durationInSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

// ============================================================
// Virtual: Score percentage
// ============================================================
quizResultSchema.virtual("scorePercentage").get(function () {
  if (this.totalQuestions === 0) return 0;
  return Math.round((this.correctAnswers / this.totalQuestions) * 100);
});

// ============================================================
// JSON output includes virtuals
// ============================================================
quizResultSchema.set("toJSON", { virtuals: true });
quizResultSchema.set("toObject", { virtuals: true });

// ============================================================
// Indexes
// ============================================================
quizResultSchema.index({ userId: 1, createdAt: -1 });
quizResultSchema.index({ userId: 1, hskLevel: 1 });

module.exports = mongoose.model("QuizResult", quizResultSchema);
