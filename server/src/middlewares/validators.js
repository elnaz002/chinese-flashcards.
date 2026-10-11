/* ============================================================
   Validation Middlewares (express-validator)
   ============================================================ */

const { body, param, query, validationResult } = require("express-validator");

/* ------------------------------------------------------------
   Helper: Run validation and return errors if any
   ------------------------------------------------------------ */
function runValidation(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg, // first error in Persian
      code: "VALIDATION_ERROR",
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }

  next();
}

/* ------------------------------------------------------------
   Auth validators
   ------------------------------------------------------------ */
const registerValidator = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("نام کاربری الزامی است.")
    .isLength({ min: 3, max: 30 })
    .withMessage("نام کاربری باید ۳ تا ۳۰ کاراکتر باشد.")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("نام کاربری فقط حروف، اعداد و _ می‌تواند باشد."),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("ایمیل الزامی است.")
    .isEmail()
    .withMessage("فرمت ایمیل نامعتبر است.")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6, max: 100 })
    .withMessage("رمز عبور باید حداقل ۶ کاراکتر باشد."),
  runValidation,
];

const loginValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("ایمیل الزامی است.")
    .isEmail()
    .withMessage("فرمت ایمیل نامعتبر است.")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("رمز عبور الزامی است."),
  runValidation,
];

/* ------------------------------------------------------------
   Card validators
   ------------------------------------------------------------ */
const createCardValidator = [
  body("character")
    .trim()
    .notEmpty()
    .withMessage("کاراکتر چینی الزامی است.")
    .isLength({ max: 50 })
    .withMessage("کاراکتر طولانی است."),
  body("pinyin")
    .trim()
    .notEmpty()
    .withMessage("پینیین الزامی است.")
    .isLength({ max: 100 })
    .withMessage("پینیین طولانی است."),
  body("meaning")
    .trim()
    .notEmpty()
    .withMessage("معنی الزامی است.")
    .isLength({ max: 200 })
    .withMessage("معنی طولانی است."),
  body("hskLevel")
    .optional()
    .isInt({ min: 1, max: 6 })
    .withMessage("سطح HSK باید بین ۱ تا ۶ باشد."),
  body("tags")
    .optional()
    .isArray({ max: 10 })
    .withMessage("حداکثر ۱۰ تگ مجاز است."),
  runValidation,
];

const updateCardValidator = [
  body("character").optional().trim().isLength({ max: 50 }),
  body("pinyin").optional().trim().isLength({ max: 100 }),
  body("meaning").optional().trim().isLength({ max: 200 }),
  body("hskLevel").optional().isInt({ min: 1, max: 6 }),
  body("tags").optional().isArray({ max: 10 }),
  runValidation,
];

/* ------------------------------------------------------------
   Note validators
   ------------------------------------------------------------ */
const saveNoteValidator = [
  param("cardId").isMongoId().withMessage("شناسه کارت معتبر نیست."),
  body("text")
    .optional()
    .isString()
    .isLength({ max: 5000 })
    .withMessage("متن یادداشت طولانی است."),
  body("gridSize")
    .optional()
    .isIn([0, 10, 20, 40])
    .withMessage("اندازه گرید نامعتبر است."),
  runValidation,
];

/* ------------------------------------------------------------
   Quiz validators
   ------------------------------------------------------------ */
const saveQuizResultValidator = [
  body("hskLevel")
    .isInt({ min: 1, max: 6 })
    .withMessage("سطح HSK باید بین ۱ تا ۶ باشد."),
  body("mode")
    .isIn(["listening", "char-to-meaning", "meaning-to-char", "char-to-pinyin"])
    .withMessage("حالت آزمون نامعتبر است."),
  body("totalQuestions")
    .isInt({ min: 1, max: 500 })
    .withMessage("تعداد سوالات نامعتبر است."),
  body("correctAnswers")
    .isInt({ min: 0 })
    .withMessage("تعداد پاسخ درست نامعتبر است."),
  body("wrongCardIds")
    .optional()
    .isArray({ max: 500 })
    .withMessage("لیست کارت‌های اشتباه نامعتبر است."),
  body("durationInSeconds")
    .optional()
    .isInt({ min: 0, max: 36000 })
    .withMessage("زمان آزمون نامعتبر است."),
  runValidation,
];

module.exports = {
  registerValidator,
  loginValidator,
  createCardValidator,
  updateCardValidator,
  saveNoteValidator,
  saveQuizResultValidator,
};
