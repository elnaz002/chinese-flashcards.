/* ============================================================
   Quiz System (Full v2)
   ============================================================
   - 4 Modes: listening, char-to-meaning, meaning-to-char, char-to-pinyin
   - Uses cards from CardStore (server or local)
   - Saves results to QuizStore (server or local)
   - Shows progress, score, and end-of-quiz review
   - Supports early exit and early finish
   ============================================================ */

/* ============================================================
   1. STATE
   ============================================================ */
let allCards = [];
let quizCards = [];
let currentQuestionIndex = 0;
let score = 0;
let quizMode = "listening";
let quizCount = 10;
let wrongAnswers = [];
let chineseVoice = null;
let isAnswered = false;
let quizFinished = false;
let quizStartTime = 0;

const LEVEL = new URLSearchParams(window.location.search).get("level") || "1";
const PLACEHOLDER_IMG = "../public/images/placeholder.png";

/* ============================================================
   2. DOM ELEMENTS
   ============================================================ */
const setupScreen = document.getElementById("quiz-setup");
const notEnoughCards = document.getElementById("not-enough-cards");
const quizOptions = document.getElementById("quiz-options");
const startFinalBtn = document.getElementById("start-quiz-final-btn");
const backBtn = document.getElementById("quiz-back-btn");

const playScreen = document.getElementById("quiz-play");
const progressText = document.getElementById("progress-text");
const scoreText = document.getElementById("score-text");
const progressFill = document.getElementById("progress-fill");
const questionArea = document.getElementById("question-area");
const answersGrid = document.getElementById("answers-grid");

const quizExitBtn = document.getElementById("quiz-exit-btn");
const quizFinishBtn = document.getElementById("quiz-finish-btn");
const modeBadge = document.getElementById("mode-badge");

const resultScreen = document.getElementById("quiz-result");
const resultEmoji = document.getElementById("result-emoji");
const resultTitle = document.getElementById("result-title");
const resultScore = document.getElementById("result-score");
const resultPercentage = document.getElementById("result-percentage");
const resultNote = document.getElementById("result-note");
const retryBtn = document.getElementById("retry-btn");
const resultBackBtn = document.getElementById("result-back-btn");
const wrongAnswersSection = document.getElementById("wrong-answers-section");
const wrongAnswersList = document.getElementById("wrong-answers-list");

const toastEl = document.getElementById("toast");

if (backBtn) backBtn.href = `hsk.html?level=${LEVEL}`;
if (resultBackBtn) resultBackBtn.href = `hsk.html?level=${LEVEL}`;

/* ============================================================
   3. TOAST
   ============================================================ */
function showToast(message, isError = false) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.toggle("error", isError);
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 2500);
}

/* ============================================================
   4. TEXT-TO-SPEECH
   ============================================================ */
function loadVoices() {
  return new Promise((resolve) => {
    let voices = window.speechSynthesis.getVoices();
    const findVoice = () => {
      voices = window.speechSynthesis.getVoices();
      chineseVoice = voices.find(
        (v) =>
          v.lang === "zh-CN" || v.lang === "zh_CN" || v.lang.startsWith("zh"),
      );
      return chineseVoice;
    };
    if (voices.length > 0) {
      resolve(!!findVoice());
    } else {
      window.speechSynthesis.onvoiceschanged = () => resolve(!!findVoice());
      setTimeout(() => resolve(!!findVoice()), 1500);
    }
  });
}

function speakText(text) {
  if (!text || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  setTimeout(() => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "zh-CN";
    utter.rate = 0.8;
    if (chineseVoice) utter.voice = chineseVoice;
    window.speechSynthesis.speak(utter);
  }, 100);
}

/* ============================================================
   5. LOAD CARDS (via CardStore)
   ============================================================ */
async function loadCards() {
  try {
    const raw = await CardStore.getAll(LEVEL);
    allCards = raw.map((c) => ({
      ...c,
      id: c.id || c._id,
    }));
  } catch (e) {
    console.error("Error loading cards:", e);
    allCards = [];
  }

  if (allCards.length < 4) {
    notEnoughCards.style.display = "block";
    quizOptions.style.display = "none";
  } else {
    notEnoughCards.style.display = "none";
    quizOptions.style.display = "block";
  }
}

/* ============================================================
   6. SETUP HANDLERS
   ============================================================ */
document.querySelectorAll('input[name="quiz-mode"]').forEach((radio) => {
  radio.addEventListener("change", (e) => {
    quizMode = e.target.value;
    document.querySelectorAll(".mode-card").forEach((card) => {
      card.classList.toggle("selected", card.dataset.mode === quizMode);
    });
  });
});

document.querySelectorAll('input[name="quiz-count"]').forEach((radio) => {
  radio.addEventListener("change", (e) => {
    quizCount = e.target.value;
  });
});

if (startFinalBtn) {
  startFinalBtn.addEventListener("click", startQuiz);
}

/* ============================================================
   7. SHUFFLE
   ============================================================ */
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/* ============================================================
   8. START QUIZ
   ============================================================ */
function startQuiz() {
  let count = allCards.length;
  if (quizCount !== "all") {
    count = Math.min(parseInt(quizCount), allCards.length);
  }

  quizCards = shuffleArray(allCards).slice(0, count);
  currentQuestionIndex = 0;
  score = 0;
  wrongAnswers = [];
  isAnswered = false;
  quizFinished = false;
  quizStartTime = Date.now();

  setupScreen.style.display = "none";
  playScreen.style.display = "block";
  resultScreen.style.display = "none";

  if (modeBadge) {
    const labels = {
      listening: "🎧 شنیداری",
      "char-to-meaning": "🀄 کاراکتر → معنی",
      "meaning-to-char": "📝 معنی → کاراکتر",
      "char-to-pinyin": "🔤 کاراکتر → پینیین",
    };
    modeBadge.textContent = labels[quizMode] || "🎯 آزمون";
  }

  updateProgress();
  renderQuestion();
}

/* ============================================================
   9. PROGRESS
   ============================================================ */
function updateProgress() {
  const total = quizCards.length;
  const current = currentQuestionIndex + 1;
  progressText.textContent = `سوال ${current} از ${total}`;
  scoreText.textContent = `امتیاز: ${score}`;
  progressFill.style.width = `${((current - 1) / total) * 100}%`;
}

/* ============================================================
   10. RENDER QUESTION
   ============================================================ */
function renderQuestion() {
  isAnswered = false;
  const card = quizCards[currentQuestionIndex];
  const correctAnswer = getCorrectAnswer(card);
  const options = buildOptions(card, correctAnswer);

  questionArea.innerHTML = "";
  answersGrid.innerHTML = "";

  if (quizMode === "listening") {
    questionArea.innerHTML = `
            <p class="question-label">🔊 کدام کاراکتر را شنیدید؟</p>
            <div class="question-audio-icon">🔊</div>
            <button class="replay-audio-btn" id="replay-audio-btn">🔁 پخش دوباره</button>
        `;
    setTimeout(() => speakText(card.character), 300);
    const replayBtn = document.getElementById("replay-audio-btn");
    if (replayBtn)
      replayBtn.addEventListener("click", () => speakText(card.character));
  } else if (quizMode === "char-to-meaning") {
    questionArea.innerHTML = `
            <p class="question-label">🀄 معنی این کاراکتر چیست؟</p>
            <div class="question-character">${card.character}</div>
            <div class="question-pinyin">${card.pinyin}</div>
        `;
  } else if (quizMode === "meaning-to-char") {
    questionArea.innerHTML = `
            <p class="question-label">📝 کدام کاراکتر به این معنی است؟</p>
            <div class="question-meaning">${card.meaning}</div>
        `;
  } else if (quizMode === "char-to-pinyin") {
    questionArea.innerHTML = `
            <p class="question-label">🔤 تلفظ (پینیین) این کاراکتر چیست؟</p>
            <div class="question-character">${card.character}</div>
        `;
  }

  options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.className = "answer-btn";
    btn.dataset.value = opt.value;

    if (quizMode === "listening" || quizMode === "meaning-to-char") {
      btn.innerHTML = `<span class="answer-char">${opt.value}</span>`;
    } else {
      btn.textContent = opt.value;
    }

    btn.addEventListener("click", () =>
      handleAnswer(btn, opt.value, correctAnswer, card),
    );
    answersGrid.appendChild(btn);
  });
}

/* ============================================================
   11. GET CORRECT ANSWER
   ============================================================ */
function getCorrectAnswer(card) {
  switch (quizMode) {
    case "listening":
      return card.character;
    case "char-to-meaning":
      return card.meaning;
    case "meaning-to-char":
      return card.character;
    case "char-to-pinyin":
      return card.pinyin;
    default:
      return card.character;
  }
}

/* ============================================================
   12. BUILD OPTIONS
   ============================================================ */
function buildOptions(card, correctAnswer) {
  const others = allCards.filter((c) => c.id !== card.id);
  const shuffledOthers = shuffleArray(others).slice(0, 3);
  const wrongs = shuffledOthers.map((c) => getCorrectAnswer(c));
  const uniqueWrongs = [...new Set(wrongs)].filter((v) => v !== correctAnswer);

  while (uniqueWrongs.length < 3) uniqueWrongs.push("---");

  const options = [
    { value: correctAnswer, correct: true },
    ...uniqueWrongs.slice(0, 3).map((v) => ({ value: v, correct: false })),
  ];

  return shuffleArray(options);
}

/* ============================================================
   13. HANDLE ANSWER
   ============================================================ */
function handleAnswer(btn, chosenValue, correctAnswer, card) {
  if (isAnswered || quizFinished) return;
  isAnswered = true;

  const isCorrect = chosenValue === correctAnswer;
  const allBtns = document.querySelectorAll(".answer-btn");

  if (isCorrect) {
    btn.classList.add("correct");
    score++;
    scoreText.textContent = `امتیاز: ${score}`;
  } else {
    btn.classList.add("wrong");
    allBtns.forEach((b) => {
      if (b.dataset.value === correctAnswer) b.classList.add("reveal-correct");
    });
    wrongAnswers.push({
      cardId: card.id || card._id,
      card: card,
      chosenValue: chosenValue,
      correctValue: correctAnswer,
    });
  }

  allBtns.forEach((b) => (b.disabled = true));

  setTimeout(
    () => {
      if (quizFinished) return;
      currentQuestionIndex++;
      if (currentQuestionIndex < quizCards.length) {
        updateProgress();
        renderQuestion();
      } else {
        showResults();
      }
    },
    isCorrect ? 800 : 1600,
  );
}

/* ============================================================
   14. SHOW RESULTS (and save to server)
   ============================================================ */
async function showResults() {
  quizFinished = true;

  playScreen.style.display = "none";
  resultScreen.style.display = "block";

  const total = quizCards.length;
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;
  const duration = Math.round((Date.now() - quizStartTime) / 1000);

  resultScore.textContent = `امتیاز شما: ${score} از ${total}`;
  resultPercentage.textContent = `${percent}%`;

  if (percent >= 90) {
    resultEmoji.textContent = "🏆";
    resultTitle.textContent = "عالی! تو یک پاندای نابغه‌ای!";
  } else if (percent >= 70) {
    resultEmoji.textContent = "🎉";
    resultTitle.textContent = "خیلی خوب بود!";
  } else if (percent >= 50) {
    resultEmoji.textContent = "🐼";
    resultTitle.textContent = "خوبه، ادامه بده!";
  } else {
    resultEmoji.textContent = "📚";
    resultTitle.textContent = "نیاز به تمرین بیشتر داری";
  }

  if (resultNote) {
    const answered = currentQuestionIndex + (isAnswered ? 1 : 0);
    if (answered < total) {
      resultNote.textContent = `(آزمون را زودتر تمام کردید - ${score} پاسخ درست از ${answered} سوال)`;
    } else {
      resultNote.textContent = "";
    }
  }

  // Render wrong answers list
  if (wrongAnswers.length > 0) {
    wrongAnswersSection.style.display = "block";
    wrongAnswersList.innerHTML = "";

    wrongAnswers.forEach((item) => {
      const div = document.createElement("div");
      div.className = "wrong-answer-item";
      div.innerHTML = `
                <div class="wrong-char-info">
                    <span class="wrong-char">${item.card.character}</span>
                    <div>
                        <div class="wrong-pinyin">${item.card.pinyin}</div>
                        <div class="wrong-meaning">${item.card.meaning}</div>
                    </div>
                </div>
                <button class="speak-wrong-btn" title="پخش صدا">🔊</button>
            `;
      const speakBtn = div.querySelector(".speak-wrong-btn");
      speakBtn.addEventListener("click", () => speakText(item.card.character));
      wrongAnswersList.appendChild(div);
    });
  } else {
    wrongAnswersSection.style.display = "none";
  }

  // ===== Save to server (or local) =====
  const resultData = {
    hskLevel: parseInt(LEVEL),
    mode: quizMode,
    totalQuestions: total,
    correctAnswers: score,
    wrongCardIds: wrongAnswers.map((w) => w.cardId),
    durationInSeconds: duration,
  };

  try {
    await QuizStore.saveResult(resultData);
    console.log("✅ Quiz result saved");
  } catch (error) {
    console.error("❌ Failed to save quiz result:", error);
    showToast("خطا در ذخیره نتیجه آزمون.", true);
  }
}

/* ============================================================
   15. EXIT & FINISH
   ============================================================ */
if (quizExitBtn) {
  quizExitBtn.addEventListener("click", () => {
    if (confirm("آیا از خروج از آزمون مطمئن هستید؟ نتایج ذخیره نخواهد شد.")) {
      window.location.href = `hsk.html?level=${LEVEL}`;
    }
  });
}

if (quizFinishBtn) {
  quizFinishBtn.addEventListener("click", () => {
    if (quizFinished) return;
    const answered = isAnswered
      ? currentQuestionIndex + 1
      : currentQuestionIndex;
    const total = quizCards.length;

    if (answered === 0) {
      if (
        confirm("شما به هیچ سوالی پاسخ نداده‌اید. آیا از آزمون خارج می‌شوید؟")
      ) {
        window.location.href = `hsk.html?level=${LEVEL}`;
      }
      return;
    }

    if (
      confirm(
        `شما به ${answered} از ${total} سوال پاسخ داده‌اید. آیا می‌خواهید نتیجه را ببینید؟`,
      )
    ) {
      quizCards = quizCards.slice(0, answered);
      showResults();
    }
  });
}

/* ============================================================
   16. RETRY
   ============================================================ */
if (retryBtn) {
  retryBtn.addEventListener("click", () => {
    resultScreen.style.display = "none";
    setupScreen.style.display = "block";
    quizFinished = false;
  });
}

/* ============================================================
   17. INIT
   ============================================================ */
document.addEventListener("DOMContentLoaded", async () => {
  await loadCards();
  await loadVoices();

  document.querySelectorAll(".mode-card").forEach((card) => {
    if (card.querySelector("input").checked) card.classList.add("selected");
  });

  console.log("🎯 Quiz page initialized. Level:", LEVEL);
  console.log(`📇 Available cards: ${allCards.length}`);
  console.log(`🔐 Logged In: ${AuthAPI.isLoggedIn()}`);
});
