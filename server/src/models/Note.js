/* ============================================================
   Note Model
   ============================================================
   Represents the note (text + drawing) attached to a card.
   One note per card.
   ============================================================ */

const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    cardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Card",
      required: true,
      unique: true, // one note per card
      index: true,
    },
    text: {
      type: String,
      default: "",
      maxlength: [5000, "Note text too long"],
    },
    canvas: {
      type: String,
      default: "", // Base64 image of drawing
    },
    gridSize: {
      type: Number,
      default: 20,
      enum: [0, 10, 20, 40], // must be one of these values
    },
    styles: {
      fontFamily: { type: String, default: "Vazirmatn, sans-serif" },
      fontSize: { type: String, default: "18" },
      color: { type: String, default: "#1a1a1a" },
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Note", noteSchema);
