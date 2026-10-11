/* ============================================================
   Validate MongoDB ObjectId Middleware
   ============================================================
   Checks if :id param is a valid MongoDB ObjectId.
   ============================================================ */

const mongoose = require("mongoose");

function validateObjectId(req, res, next) {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "شناسه وارد شده معتبر نیست.",
    });
  }

  next();
}

module.exports = { validateObjectId };
