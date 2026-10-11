/* ============================================================
   Quiz Controller
   ============================================================
   Handles quiz results, stats, and wrong-card review.
   ============================================================ */

const { QuizResult, Card, User } = require("../models");

/* ------------------------------------------------------------
   @desc    Save a completed quiz result
   @route   POST /api/quiz/results
   @access  Private
   ------------------------------------------------------------ */
async function saveResult(req, res, next) {
  try {
    const {
      hskLevel,
      mode,
      totalQuestions,
      correctAnswers,
      wrongCardIds,
      durationInSeconds,
    } = req.body;

    // ---- Validation ----
    if (!hskLevel || !mode || !totalQuestions) {
      return res.status(400).json({
        success: false,
        message: "سطح HSK، حالت آزمون و تعداد سوالات الزامی هستند.",
      });
    }

    if (correctAnswers === undefined || correctAnswers < 0) {
      return res.status(400).json({
        success: false,
        message: "تعداد پاسخ‌های درست الزامی است.",
      });
    }

    if (correctAnswers > totalQuestions) {
      return res.status(400).json({
        success: false,
        message: "تعداد پاسخ‌های درست نمی‌تواند بیشتر از تعداد سوالات باشد.",
      });
    }

    // ---- Verify wrong card IDs belong to this user ----
    let verifiedWrongCardIds = [];
    if (Array.isArray(wrongCardIds) && wrongCardIds.length > 0) {
      const userCards = await Card.find({
        _id: { $in: wrongCardIds },
        userId: req.user._id,
      }).select("_id");

      verifiedWrongCardIds = userCards.map((c) => c._id);
    }

    // ---- Create result ----
    const result = await QuizResult.create({
      userId: req.user._id,
      hskLevel,
      mode,
      totalQuestions,
      correctAnswers,
      wrongCardIds: verifiedWrongCardIds,
      durationInSeconds: durationInSeconds || 0,
    });

    // ---- Update user stats ----
    await User.findByIdAndUpdate(req.user._id, {
      $inc: {
        "stats.totalQuizzes": 1,
        "stats.totalCorrectAnswers": correctAnswers,
        "stats.totalQuestions": totalQuestions,
      },
    });

    return res.status(201).json({
      success: true,
      message: "نتیجه آزمون ذخیره شد! 🎉",
      data: { result },
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
   @desc    Get all quiz results for current user
   @route   GET /api/quiz/results
   @access  Private
   @query   level (optional), limit (default 50)
   ------------------------------------------------------------ */
async function getResults(req, res, next) {
  try {
    const { level, limit } = req.query;

    const filter = { userId: req.user._id };
    if (level) filter.hskLevel = parseInt(level, 10);

    const maxResults = Math.min(parseInt(limit, 10) || 50, 200);

    const results = await QuizResult.find(filter)
      .sort({ createdAt: -1 })
      .limit(maxResults)
      .populate("wrongCardIds", "character pinyin meaning");

    return res.status(200).json({
      success: true,
      count: results.length,
      data: { results },
    });
  } catch (error) {
    next(error);
  }
}

/* ------------------------------------------------------------
   @desc    Get a single quiz result
   @route   GET /api/quiz/results/:id
   @access  Private
   ------------------------------------------------------------ */
async function getResultById(req, res, next) {
  try {
    const result = await QuizResult.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).populate("wrongCardIds", "character pinyin meaning hskLevel");

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "نتیجه آزمون یافت نشد.",
      });
    }

    return res.status(200).json({
      success: true,
      data: { result },
    });
  } catch (error) {
    next(error);
  }
}

/* ------------------------------------------------------------
   @desc    Get overall quiz statistics
   @route   GET /api/quiz/stats
   @access  Private
   ------------------------------------------------------------ */
async function getStats(req, res, next) {
  try {
    const userId = req.user._id;

    // ---- Overall stats (aggregation) ----
    const overallAgg = await QuizResult.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalQuizzes: { $sum: 1 },
          totalQuestions: { $sum: "$totalQuestions" },
          totalCorrect: { $sum: "$correctAnswers" },
          totalDuration: { $sum: "$durationInSeconds" },
          bestPercentage: {
            $max: {
              $cond: [
                { $gt: ["$totalQuestions", 0] },
                {
                  $multiply: [
                    { $divide: ["$correctAnswers", "$totalQuestions"] },
                    100,
                  ],
                },
                0,
              ],
            },
          },
        },
      },
    ]);

    const overall = overallAgg[0] || {
      totalQuizzes: 0,
      totalQuestions: 0,
      totalCorrect: 0,
      totalDuration: 0,
      bestPercentage: 0,
    };

    // Average percentage
    overall.averagePercentage =
      overall.totalQuestions > 0
        ? Math.round((overall.totalCorrect / overall.totalQuestions) * 100)
        : 0;

    overall.bestPercentage = Math.round(overall.bestPercentage);
    overall.totalDuration = Math.round(overall.totalDuration);

    // ---- Stats per HSK level ----
    const byLevelAgg = await QuizResult.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: "$hskLevel",
          totalQuizzes: { $sum: 1 },
          totalQuestions: { $sum: "$totalQuestions" },
          totalCorrect: { $sum: "$correctAnswers" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const byLevel = byLevelAgg.map((item) => ({
      hskLevel: item._id,
      totalQuizzes: item.totalQuizzes,
      totalQuestions: item.totalQuestions,
      totalCorrect: item.totalCorrect,
      percentage:
        item.totalQuestions > 0
          ? Math.round((item.totalCorrect / item.totalQuestions) * 100)
          : 0,
    }));

    // ---- Recent activity (last 7 days) ----
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentCount = await QuizResult.countDocuments({
      userId: userId,
      createdAt: { $gte: sevenDaysAgo },
    });

    // ---- Wrong cards count (unique) ----
    const wrongCardsAgg = await QuizResult.aggregate([
      { $match: { userId: userId } },
      { $unwind: "$wrongCardIds" },
      {
        $group: {
          _id: "$wrongCardIds",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        overall,
        byLevel,
        recentActivity: {
          last7Days: recentCount,
        },
        wrongCardsCount: wrongCardsAgg.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

/* ------------------------------------------------------------
   @desc    Get wrong cards for review (unique, sorted by frequency)
   @route   GET /api/quiz/wrong-cards
   @access  Private
   @query   limit (default 20)
   ------------------------------------------------------------ */
async function getWrongCards(req, res, next) {
  try {
    const userId = req.user._id;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

    const aggregation = await QuizResult.aggregate([
      { $match: { userId: userId } },
      { $unwind: "$wrongCardIds" },
      {
        $group: {
          _id: "$wrongCardIds",
          wrongCount: { $sum: 1 },
          lastWrongAt: { $max: "$createdAt" },
        },
      },
      { $sort: { wrongCount: -1, lastWrongAt: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "cards",
          localField: "_id",
          foreignField: "_id",
          as: "card",
        },
      },
      { $unwind: "$card" },
      // Make sure the card still belongs to this user
      { $match: { "card.userId": userId } },
      {
        $project: {
          _id: 0,
          wrongCount: 1,
          lastWrongAt: 1,
          card: {
            _id: "$card._id",
            character: "$card.character",
            pinyin: "$card.pinyin",
            meaning: "$card.meaning",
            image: "$card.image",
            hskLevel: "$card.hskLevel",
            tags: "$card.tags",
          },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      count: aggregation.length,
      data: { wrongCards: aggregation },
    });
  } catch (error) {
    next(error);
  }
}

/* ------------------------------------------------------------
   @desc    Delete a quiz result
   @route   DELETE /api/quiz/results/:id
   @access  Private
   ------------------------------------------------------------ */
async function deleteResult(req, res, next) {
  try {
    const result = await QuizResult.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "نتیجه آزمون یافت نشد.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "نتیجه آزمون حذف شد.",
    });
  } catch (error) {
    next(error);
  }
}

/* ------------------------------------------------------------
   @desc    Clear all quiz results (reset progress)
   @route   DELETE /api/quiz/results
   @access  Private
   ------------------------------------------------------------ */
async function clearAllResults(req, res, next) {
  try {
    const result = await QuizResult.deleteMany({ userId: req.user._id });

    // Reset user stats for quizzes
    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        "stats.totalQuizzes": 0,
        "stats.totalCorrectAnswers": 0,
        "stats.totalQuestions": 0,
      },
    });

    return res.status(200).json({
      success: true,
      message: `${result.deletedCount} نتیجه آزمون پاک شد.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  saveResult,
  getResults,
  getResultById,
  getStats,
  getWrongCards,
  deleteResult,
  clearAllResults,
};
