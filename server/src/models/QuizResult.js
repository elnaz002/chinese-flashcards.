/* ============================================================
   QuizResult Model
   ============================================================
   Represents a completed quiz session.
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
    wrongCardIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Card",
      default: [],
    },
    durationInSeconds: {
      type: Number,
      default: 0,
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

// Ensure virtuals are included in JSON output
quizResultSchema.set("toJSON", { virtuals: true });

// ============================================================
// Indexes
// ============================================================
quizResultSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("QuizResult", quizResultSchema);
