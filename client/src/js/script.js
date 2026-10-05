/* ============================================================
   Chinese Flashcards App - Main Script (Final)
   Features: Add/Edit/Delete, Flip, TTS, Notepad, Grid Size,
             Quiz Launcher, Tags, Search, Filter, Stats, Favorites
   ============================================================ */

/* ============================================================
   1. GLOBAL VARIABLES
   ============================================================ */
let allCards = [];
let currentIndex = 0;
let selectedImageBase64 = "";
let editingCardId = null;
let currentSearchQuery = "";
let currentTagFilter = "all";
let currentViewMode = "all"; // 'all' or 'favorites'

// Tag management (in Add/Edit form)
let formSelectedTags = [];

const LEVEL = new URLSearchParams(window.location.search).get("level") || "1";
const STORAGE_KEY = `flashcards_hsk_${LEVEL}`;
const PLACEHOLDER_IMG = "../public/images/placeholder.png";
const NOTE_STORAGE_PREFIX = "flashcard_note_";

const PREDEFINED_TAGS = [
  "خانواده",
  "غذا",
  "حیوانات",
  "احوال‌پرسی",
  "رنگ‌ها",
  "اعداد",
  "افعال",
  "صفات",
  "مکان‌ها",
  "زمان",
];

// Notepad state
let currentNoteCardId = null;
let notepadMode = "text";
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let currentBrushColor = "#dc2626";
let currentBrushSize = 5;
let isEraser = false;
let ctx = null;

/* ============================================================
   2. DOM ELEMENTS
   ============================================================ */
const galleryGrid = document.getElementById("gallery-grid");
const emptyState = document.getElementById("empty-state");
const noResults = document.getElementById("no-results");
const levelDisplay = document.getElementById("level-display");
const addCardBtn = document.getElementById("add-card-btn");
const addModalOverlay = document.getElementById("add-modal-overlay");
const closeAddModal = document.getElementById("close-add-modal");
const addCardForm = document.getElementById("add-card-form");
const formTitle = document.getElementById("form-title");
const formSubmitBtn = document.getElementById("form-submit-btn");
const imageFileInput = document.getElementById("input-image-file");
const imagePreview = document.getElementById("image-preview");
const suggestSentenceBtn = document.getElementById("suggest-sentence-btn");

// Search & Filter
const searchInput = document.getElementById("search-input");
const clearSearchBtn = document.getElementById("clear-search-btn");
const tagFilterSelect = document.getElementById("tag-filter");
const viewAllBtn = document.getElementById("view-all");
const viewFavoritesBtn = document.getElementById("view-favorites");

// Stats
const statTotal = document.getElementById("stat-total");
const statTags = document.getElementById("stat-tags");
const statFiltered = document.getElementById("stat-filtered");

// Tags in form
const tagsSuggestions = document.getElementById("tags-suggestions");
const selectedTagsContainer = document.getElementById("selected-tags");
const customTagInput = document.getElementById("custom-tag-input");
const addCustomTagBtn = document.getElementById("add-custom-tag-btn");

// Tags display in modal
const cardTagsDisplay = document.getElementById("card-tags-display");

// Quiz
const startQuizBtn = document.getElementById("start-quiz-btn");
const cardCountBadge = document.getElementById("card-count-badge");

// Voice
const voiceIndicator = document.getElementById("voice-indicator");
const voiceIcon = document.getElementById("voice-icon");

// Modal
const modalOverlay = document.getElementById("modal-overlay");
const closeModal = document.getElementById("close-modal");
const largeFlashcard = document.getElementById("large-flashcard");
const modalImage = document.getElementById("modal-image");
const modalChar = document.getElementById("modal-char");
const modalPinyin = document.getElementById("modal-pinyin");
const modalSentence = document.getElementById("modal-sentence");
const modalSentencePinyin = document.getElementById("modal-sentence-pinyin");
const modalMeaning = document.getElementById("modal-meaning");
const modalSentenceMeaning = document.getElementById("modal-sentence-meaning");
const speakCharBtn = document.getElementById("speak-char-btn");
const speakSentenceBtn = document.getElementById("speak-sentence-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const editCurrentCardBtn = document.getElementById("edit-current-card-btn");
const deleteCurrentCardBtn = document.getElementById("delete-current-card-btn");
const favoriteCurrentCardBtn = document.getElementById(
  "favorite-current-card-btn",
);

// Lightbox
const lightboxOverlay = document.getElementById("lightbox-overlay");
const lightboxImage = document.getElementById("lightbox-image");
const lightboxClose = document.getElementById("lightbox-close");

// Notepad
const openNoteBtn = document.getElementById("open-note-btn");
const notepadOverlay = document.getElementById("notepad-overlay");
const notepadClose = document.getElementById("notepad-close");
const modeTextBtn = document.getElementById("mode-text");
const modeDrawBtn = document.getElementById("mode-draw");
const textTools = document.getElementById("text-tools");
const drawTools = document.getElementById("draw-tools");
const gridTools = document.getElementById("grid-tools");
const notepadText = document.getElementById("notepad-text");
const notepadCanvas = document.getElementById("notepad-canvas");
const noteTextarea = document.getElementById("note-textarea");
const drawCanvas = document.getElementById("draw-canvas");
const fontFamilySelect = document.getElementById("font-family");
const fontSizeSelect = document.getElementById("font-size");
const textColorInput = document.getElementById("text-color");
const brushColorInput = document.getElementById("brush-color");
const brushSizeInput = document.getElementById("brush-size");
const brushSizeDisplay = document.getElementById("brush-size-display");
const eraserBtn = document.getElementById("eraser-btn");
const clearCanvasBtn = document.getElementById("clear-canvas-btn");
const gridSizeBtns = document.querySelectorAll(".grid-size-btn");
const saveNoteBtn = document.getElementById("save-note-btn");

// Toast
const toastEl = document.getElementById("toast");

if (levelDisplay) levelDisplay.textContent = LEVEL;

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
   4. LOGIN / SIGNUP PLACEHOLDER
   ============================================================ */
const loginBtn = document.getElementById("login-btn");
const signupBtn = document.getElementById("signup-btn");

if (loginBtn)
  loginBtn.addEventListener("click", () =>
    showToast("🔐 قابلیت ورود به زودی!"),
  );
if (signupBtn)
  signupBtn.addEventListener("click", () =>
    showToast("✨ قابلیت ثبت‌نام به زودی!"),
  );

/* ============================================================
   5. TEXT-TO-SPEECH
   ============================================================ */
let chineseVoice = null;

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
      const found = findVoice();
      updateVoiceIndicator(!!found);
      resolve(!!found);
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        const found = findVoice();
        updateVoiceIndicator(!!found);
        resolve(!!found);
      };
      setTimeout(() => {
        if (!chineseVoice) {
          const found = findVoice();
          updateVoiceIndicator(!!found);
          resolve(!!found);
        }
      }, 1500);
    }
  });
}

function updateVoiceIndicator(isReady) {
  if (!voiceIndicator) return;
  if (isReady) {
    voiceIndicator.classList.add("ready");
    voiceIndicator.classList.remove("not-ready");
    voiceIcon.textContent = "🔊";
  } else {
    voiceIndicator.classList.add("not-ready");
    voiceIndicator.classList.remove("ready");
    voiceIcon.textContent = "🔇";
  }
  voiceIndicator.onclick = () => speakText("你好");
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
   6. IMAGE COMPRESSION
   ============================================================ */
function compressImage(file, maxWidth = 400, maxHeight = 400, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx2d = canvas.getContext("2d");
        ctx2d.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject("خطا در بارگذاری تصویر.");
      img.src = event.target.result;
    };
    reader.onerror = () => reject("خطا در خواندن فایل.");
    reader.readAsDataURL(file);
  });
}

/* ============================================================
   7. SMART SENTENCE SUGGESTION
   ============================================================ */
const sentencePatterns = {
  verb: [
    {
      s: (w) => `我${w}汉语。`,
      p: (w, py) => `Wǒ ${py} Hànyǔ.`,
      m: (mn) => `من ${mn} می‌کنم (چینی).`,
    },
    {
      s: (w) => `你${w}吗？`,
      p: (w, py) => `Nǐ ${py} ma?`,
      m: (mn) => `آیا تو ${mn} می‌کنی؟`,
    },
  ],
  noun: [
    {
      s: (w) => `这是我的${w}。`,
      p: (w, py) => `Zhè shì wǒ de ${py}.`,
      m: (mn) => `این ${mn} من است.`,
    },
    {
      s: (w) => `我有一个${w}。`,
      p: (w, py) => `Wǒ yǒu yī gè ${py}.`,
      m: (mn) => `من یک ${mn} دارم.`,
    },
  ],
  adjective: [
    {
      s: (w) => `这个很${w}。`,
      p: (w, py) => `Zhège hěn ${py}.`,
      m: (mn) => `این خیلی ${mn} است.`,
    },
    {
      s: (w) => `今天很${w}。`,
      p: (w, py) => `Jīntiān hěn ${py}.`,
      m: (mn) => `امروز خیلی ${mn} است.`,
    },
  ],
  default: [
    {
      s: (w) => `这个字是${w}。`,
      p: (w, py) => `Zhège zì shì ${py}.`,
      m: (mn) => `این کلمه ${mn} است.`,
    },
  ],
};

const knownWords = {
  吃: { cat: "verb", pinyin: "chī", meaning: "خوردن" },
  喝: { cat: "verb", pinyin: "hē", meaning: "نوشیدن" },
  看: { cat: "verb", pinyin: "kàn", meaning: "دیدن" },
  听: { cat: "verb", pinyin: "tīng", meaning: "شنیدن" },
  说: { cat: "verb", pinyin: "shuō", meaning: "گفتن" },
  学习: { cat: "verb", pinyin: "xuéxí", meaning: "یاد گرفتن" },
  水: { cat: "noun", pinyin: "shuǐ", meaning: "آب" },
  书: { cat: "noun", pinyin: "shū", meaning: "کتاب" },
  家: { cat: "noun", pinyin: "jiā", meaning: "خانه" },
  学校: { cat: "noun", pinyin: "xuéxiào", meaning: "مدرسه" },
  朋友: { cat: "noun", pinyin: "péngyǒu", meaning: "دوست" },
  老师: { cat: "noun", pinyin: "lǎoshī", meaning: "معلم" },
  妈妈: { cat: "noun", pinyin: "māma", meaning: "مادر" },
  爸爸: { cat: "noun", pinyin: "bàba", meaning: "پدر" },
  猫: { cat: "noun", pinyin: "māo", meaning: "گربه" },
  狗: { cat: "noun", pinyin: "gǒu", meaning: "سگ" },
  好: { cat: "adjective", pinyin: "hǎo", meaning: "خوب" },
  大: { cat: "adjective", pinyin: "dà", meaning: "بزرگ" },
  小: { cat: "adjective", pinyin: "xiǎo", meaning: "کوچک" },
  热: { cat: "adjective", pinyin: "rè", meaning: "گرم" },
};

function suggestSentence() {
  const charInput = document.getElementById("input-char").value.trim();
  const pinyinInput = document.getElementById("input-pinyin").value.trim();
  const meaningInput = document.getElementById("input-meaning").value.trim();
  if (!charInput) {
    showToast("لطفاً ابتدا کاراکتر چینی را وارد کنید.", true);
    return;
  }
  const wordData = knownWords[charInput];
  const category = wordData ? wordData.cat : "default";
  const pinyin = pinyinInput || (wordData ? wordData.pinyin : charInput);
  const meaning = meaningInput || (wordData ? wordData.meaning : charInput);
  const patterns = sentencePatterns[category];
  const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
  document.getElementById("input-sentence").value = randomPattern.s(charInput);
  document.getElementById("input-sentence-pinyin").value = randomPattern.p(
    charInput,
    pinyin,
  );
  document.getElementById("input-sentence-meaning").value =
    randomPattern.m(meaning);
}

/* ============================================================
   8. LOCAL STORAGE
   ============================================================ */
function loadCards() {
  const stored = localStorage.getItem(STORAGE_KEY);
  try {
    allCards = stored ? JSON.parse(stored) : [];
    // Ensure all cards have tags and favorite properties
    allCards = allCards.map((c) => ({
      ...c,
      tags: c.tags || [],
      favorite: c.favorite || false,
    }));
  } catch (e) {
    console.error("Error parsing cards:", e);
    allCards = [];
  }
  updateStats();
  updateTagFilterOptions();
  renderGallery();
  updateCardCount();
}

function saveCards() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allCards));
  } catch (e) {
    showToast("حافظه پر است. لطفاً کارت‌های قدیمی را حذف کنید.", true);
  }
  updateStats();
  updateCardCount();
}

/* ============================================================
   9. STATS
   ============================================================ */
function updateStats() {
  if (statTotal) statTotal.textContent = allCards.length;

  // Count unique tags
  const uniqueTags = new Set();
  allCards.forEach((c) => (c.tags || []).forEach((t) => uniqueTags.add(t)));
  if (statTags) statTags.textContent = uniqueTags.size;

  // Filtered count
  const filtered = getFilteredCards();
  if (statFiltered) statFiltered.textContent = filtered.length;
}

/* ============================================================
   10. TAGS FILTER DROPDOWN
   ============================================================ */
function updateTagFilterOptions() {
  if (!tagFilterSelect) return;

  // Collect all unique tags
  const uniqueTags = new Set();
  allCards.forEach((c) => (c.tags || []).forEach((t) => uniqueTags.add(t)));

  // Save current selection
  const currentVal = tagFilterSelect.value;

  // Reset dropdown (keep "all")
  tagFilterSelect.innerHTML = '<option value="all">🏷️ همه دسته‌ها</option>';

  // Sort alphabetically (Persian)
  const sortedTags = [...uniqueTags].sort((a, b) => a.localeCompare(b, "fa"));

  sortedTags.forEach((tag) => {
    const opt = document.createElement("option");
    opt.value = tag;
    opt.textContent = `🏷️ ${tag}`;
    tagFilterSelect.appendChild(opt);
  });

  // Restore selection if still valid
  if (
    currentVal &&
    [...tagFilterSelect.options].some((o) => o.value === currentVal)
  ) {
    tagFilterSelect.value = currentVal;
  } else {
    currentTagFilter = "all";
  }
}

/* ============================================================
   11. FILTER & SEARCH
   ============================================================ */
function getFilteredCards() {
  let result = [...allCards];

  // View mode filter
  if (currentViewMode === "favorites") {
    result = result.filter((c) => c.favorite);
  }

  // Tag filter
  if (currentTagFilter !== "all") {
    result = result.filter((c) => (c.tags || []).includes(currentTagFilter));
  }

  // Search filter
  if (currentSearchQuery.trim()) {
    const q = currentSearchQuery.trim().toLowerCase();
    result = result.filter(
      (c) =>
        (c.character || "").toLowerCase().includes(q) ||
        (c.pinyin || "").toLowerCase().includes(q) ||
        (c.meaning || "").toLowerCase().includes(q),
    );
  }

  return result;
}

/* ============================================================
   12. GALLERY RENDERING (with filter)
   ============================================================ */
function renderGallery() {
  if (!galleryGrid) return;
  galleryGrid.innerHTML = "";

  const filtered = getFilteredCards();

  if (allCards.length === 0) {
    if (emptyState) emptyState.style.display = "block";
    if (noResults) noResults.style.display = "none";
    galleryGrid.style.display = "none";
    updateStats();
    return;
  }

  if (emptyState) emptyState.style.display = "none";

  if (filtered.length === 0) {
    if (noResults) noResults.style.display = "block";
    galleryGrid.style.display = "none";
    updateStats();
    return;
  }

  if (noResults) noResults.style.display = "none";
  galleryGrid.style.display = "grid";

  filtered.forEach((card) => {
    // Find real index in allCards for opening modal
    const realIndex = allCards.findIndex((c) => c.id === card.id);

    const cardDiv = document.createElement("div");
    cardDiv.className = "small-card";
    if (card.favorite) cardDiv.classList.add("is-favorite");

    cardDiv.innerHTML = `
            ${card.favorite ? '<span class="favorite-badge">⭐</span>' : ""}
            <img src="${card.image || PLACEHOLDER_IMG}" 
                 alt="${card.character}"
                 onerror="this.src='${PLACEHOLDER_IMG}'">
            <span class="small-char">${card.character}</span>
            <span class="small-pinyin">${card.pinyin}</span>
            ${
              card.tags && card.tags.length > 0
                ? `
                <div class="small-card-tags">
                    ${card.tags
                      .slice(0, 2)
                      .map((t) => `<span class="mini-tag">${t}</span>`)
                      .join("")}
                </div>
            `
                : ""
            }
        `;
    cardDiv.addEventListener("click", () => openLargeModal(realIndex));
    galleryGrid.appendChild(cardDiv);
  });

  updateStats();
}

/* ============================================================
   13. SEARCH & FILTER EVENT HANDLERS
   ============================================================ */
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    currentSearchQuery = e.target.value;
    clearSearchBtn.classList.toggle("visible", currentSearchQuery.length > 0);
    renderGallery();
  });
}

if (clearSearchBtn) {
  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    currentSearchQuery = "";
    clearSearchBtn.classList.remove("visible");
    renderGallery();
  });
}

if (tagFilterSelect) {
  tagFilterSelect.addEventListener("change", (e) => {
    currentTagFilter = e.target.value;
    renderGallery();
  });
}

if (viewAllBtn) {
  viewAllBtn.addEventListener("click", () => {
    currentViewMode = "all";
    viewAllBtn.classList.add("active");
    viewFavoritesBtn.classList.remove("active");
    renderGallery();
  });
}

if (viewFavoritesBtn) {
  viewFavoritesBtn.addEventListener("click", () => {
    currentViewMode = "favorites";
    viewFavoritesBtn.classList.add("active");
    viewAllBtn.classList.remove("active");
    renderGallery();
  });
}

/* ============================================================
   14. CARD COUNT BADGE
   ============================================================ */
function updateCardCount() {
  if (!cardCountBadge) return;
  cardCountBadge.textContent = `${allCards.length} کارت`;

  if (startQuizBtn) {
    if (allCards.length < 4) {
      startQuizBtn.disabled = true;
      startQuizBtn.style.opacity = "0.5";
      startQuizBtn.style.cursor = "not-allowed";
      startQuizBtn.title = "برای شروع آزمون حداقل ۴ کارت نیاز است";
    } else {
      startQuizBtn.disabled = false;
      startQuizBtn.style.opacity = "1";
      startQuizBtn.style.cursor = "pointer";
    }
  }
}

/* ============================================================
   15. LARGE FLASHCARD MODAL
   ============================================================ */
function openLargeModal(index) {
  currentIndex = index;
  updateLargeCard();
  modalOverlay.classList.add("active");
  largeFlashcard.classList.remove("is-flipped");
  document.body.style.overflow = "hidden";
}

function closeLargeModal() {
  modalOverlay.classList.remove("active");
  document.body.style.overflow = "auto";
}

function updateLargeCard() {
  if (allCards.length === 0) return;
  const card = allCards[currentIndex];

  modalImage.src = card.image || PLACEHOLDER_IMG;
  modalChar.textContent = card.character;
  modalPinyin.textContent = card.pinyin;
  modalSentence.textContent = card.sentence || "";
  modalSentencePinyin.textContent = card.sentencePinyin || "";
  modalMeaning.textContent = card.meaning;
  modalSentenceMeaning.textContent = card.sentenceMeaning || "";
  largeFlashcard.classList.remove("is-flipped");

  // Update tags display
  if (cardTagsDisplay) {
    if (card.tags && card.tags.length > 0) {
      cardTagsDisplay.innerHTML = card.tags
        .map((t) => `<span class="display-tag">🏷️ ${t}</span>`)
        .join("");
    } else {
      cardTagsDisplay.innerHTML = "";
    }
  }

  // Update favorite button
  if (favoriteCurrentCardBtn) {
    favoriteCurrentCardBtn.classList.toggle("active", card.favorite);
    favoriteCurrentCardBtn.textContent = card.favorite ? "⭐" : "☆";
  }
}

/* ============================================================
   16. FAVORITE TOGGLE
   ============================================================ */
if (favoriteCurrentCardBtn) {
  favoriteCurrentCardBtn.addEventListener("click", () => {
    const card = allCards[currentIndex];
    if (!card) return;
    card.favorite = !card.favorite;
    saveCards();
    updateLargeCard();
    renderGallery();
    showToast(card.favorite ? "⭐ به محبوب‌ها اضافه شد" : "از محبوب‌ها حذف شد");
  });
}

/* ============================================================
   17. TAG MANAGEMENT (in Add/Edit form)
   ============================================================ */
function renderSelectedTags() {
  if (!selectedTagsContainer) return;
  selectedTagsContainer.innerHTML = "";

  formSelectedTags.forEach((tag) => {
    const chip = document.createElement("div");
    chip.className = "tag-chip";
    chip.innerHTML = `
            <span>${tag}</span>
            <button type="button" class="remove-tag" data-tag="${tag}">✕</button>
        `;
    chip.querySelector(".remove-tag").addEventListener("click", () => {
      formSelectedTags = formSelectedTags.filter((t) => t !== tag);
      renderSelectedTags();
      updateTagSuggestionButtons();
    });
    selectedTagsContainer.appendChild(chip);
  });
}

function updateTagSuggestionButtons() {
  document.querySelectorAll(".tag-suggestion").forEach((btn) => {
    const tag = btn.dataset.tag;
    btn.classList.toggle("selected", formSelectedTags.includes(tag));
  });
}

function addTagToForm(tag) {
  const cleanTag = tag.trim();
  if (!cleanTag) return;
  if (formSelectedTags.includes(cleanTag)) {
    showToast("این دسته قبلاً اضافه شده است.", true);
    return;
  }
  formSelectedTags.push(cleanTag);
  renderSelectedTags();
  updateTagSuggestionButtons();
}

// Attach click to predefined tag suggestions
document.querySelectorAll(".tag-suggestion").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tag = btn.dataset.tag;
    if (formSelectedTags.includes(tag)) {
      formSelectedTags = formSelectedTags.filter((t) => t !== tag);
    } else {
      formSelectedTags.push(tag);
    }
    renderSelectedTags();
    updateTagSuggestionButtons();
  });
});

// Add custom tag
if (addCustomTagBtn) {
  addCustomTagBtn.addEventListener("click", () => {
    addTagToForm(customTagInput.value);
    customTagInput.value = "";
  });
}

if (customTagInput) {
  customTagInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTagToForm(customTagInput.value);
      customTagInput.value = "";
    }
  });
}

/* ============================================================
   18. ADD / EDIT CARD
   ============================================================ */
function openAddModal() {
  editingCardId = null;
  formTitle.textContent = "🐼 افزودن کارت جدید";
  formSubmitBtn.textContent = "🐼 ذخیره کارت";
  addCardForm.reset();
  selectedImageBase64 = "";
  formSelectedTags = [];
  renderSelectedTags();
  updateTagSuggestionButtons();
  imagePreview.innerHTML = "<span>🐼 پیش‌نمایش تصویر</span>";
  addModalOverlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function openEditModal(cardId) {
  const card = allCards.find((c) => c.id === cardId);
  if (!card) return;

  editingCardId = cardId;
  formTitle.textContent = "✏️ ویرایش کارت";
  formSubmitBtn.textContent = "✏️ ذخیره تغییرات";

  document.getElementById("input-char").value = card.character;
  document.getElementById("input-pinyin").value = card.pinyin;
  document.getElementById("input-meaning").value = card.meaning;
  document.getElementById("input-sentence").value = card.sentence || "";
  document.getElementById("input-sentence-pinyin").value =
    card.sentencePinyin || "";
  document.getElementById("input-sentence-meaning").value =
    card.sentenceMeaning || "";

  formSelectedTags = [...(card.tags || [])];
  renderSelectedTags();
  updateTagSuggestionButtons();

  selectedImageBase64 = card.image || "";
  if (card.image) {
    imagePreview.innerHTML = `<img src="${card.image}" alt="Preview">`;
  } else {
    imagePreview.innerHTML = "<span>🐼 پیش‌نمایش تصویر</span>";
  }

  closeLargeModal();
  addModalOverlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeAddModalFunc() {
  addModalOverlay.classList.remove("active");
  document.body.style.overflow = "auto";
  addCardForm.reset();
  selectedImageBase64 = "";
  editingCardId = null;
  formSelectedTags = [];
  imagePreview.innerHTML = "<span>🐼 پیش‌نمایش تصویر</span>";
}

function handleAddCardSubmit(event) {
  event.preventDefault();

  const cardData = {
    character: document.getElementById("input-char").value.trim(),
    pinyin: document.getElementById("input-pinyin").value.trim(),
    meaning: document.getElementById("input-meaning").value.trim(),
    sentence: document.getElementById("input-sentence").value.trim(),
    sentencePinyin: document
      .getElementById("input-sentence-pinyin")
      .value.trim(),
    sentenceMeaning: document
      .getElementById("input-sentence-meaning")
      .value.trim(),
    tags: [...formSelectedTags],
  };

  if (editingCardId) {
    const card = allCards.find((c) => c.id === editingCardId);
    if (card) {
      Object.assign(card, cardData);
      if (selectedImageBase64) card.image = selectedImageBase64;
    }
    showToast("✅ کارت ویرایش شد!");
  } else {
    const newCard = {
      id: "card_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
      image: selectedImageBase64,
      favorite: false,
      ...cardData,
    };
    allCards.push(newCard);
    showToast("✅ کارت اضافه شد!");
  }

  saveCards();
  updateTagFilterOptions();
  closeAddModalFunc();
  renderGallery();
}

/* ============================================================
   19. DELETE CARD
   ============================================================ */
function deleteCard(cardId) {
  const card = allCards.find((c) => c.id === cardId);
  if (!card) return;

  if (!confirm(`آیا از حذف کارت "${card.character}" مطمئن هستید؟`)) return;

  allCards = allCards.filter((c) => c.id !== cardId);
  saveCards();

  localStorage.removeItem(NOTE_STORAGE_PREFIX + cardId + "_text");
  localStorage.removeItem(NOTE_STORAGE_PREFIX + cardId + "_styles");
  localStorage.removeItem(NOTE_STORAGE_PREFIX + cardId + "_canvas");
  localStorage.removeItem(NOTE_STORAGE_PREFIX + cardId + "_gridsize");

  closeLargeModal();
  updateTagFilterOptions();
  renderGallery();
  showToast("🗑️ کارت حذف شد.");
}

/* ============================================================
   20. IMAGE UPLOAD
   ============================================================ */
async function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    imagePreview.innerHTML = "<span>⏳ در حال فشرده‌سازی...</span>";
    selectedImageBase64 = await compressImage(file);
    imagePreview.innerHTML = `<img src="${selectedImageBase64}" alt="Preview">`;
  } catch (error) {
    showToast("خطا در پردازش تصویر.", true);
    imagePreview.innerHTML = "<span>🐼 پیش‌نمایش تصویر</span>";
    selectedImageBase64 = "";
  }
}

/* ============================================================
   21. IMAGE LIGHTBOX
   ============================================================ */
function openLightbox(src) {
  if (!src || src.includes("placeholder")) return;
  lightboxImage.src = src;
  lightboxOverlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightboxOverlay.classList.remove("active");
  if (modalOverlay.classList.contains("active")) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "auto";
  }
}

/* ============================================================
   22. NOTEPAD
   ============================================================ */
function initCanvas() {
  if (!drawCanvas) return;
  const container = drawCanvas.parentElement;
  const rect = container.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  drawCanvas.width = rect.width * dpr;
  drawCanvas.height = rect.height * dpr;
  ctx = drawCanvas.getContext("2d");
  ctx.scale(dpr, dpr);
  drawCanvas.style.width = rect.width + "px";
  drawCanvas.style.height = rect.height + "px";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

function openNotepad() {
  if (allCards.length === 0) return;
  const card = allCards[currentIndex];
  currentNoteCardId = card.id;
  loadNote(card.id);
  notepadOverlay.classList.add("active");
  document.body.style.overflow = "hidden";
  setTimeout(() => {
    initCanvas();
    const savedCanvas = localStorage.getItem(
      NOTE_STORAGE_PREFIX + card.id + "_canvas",
    );
    if (savedCanvas) {
      const img = new Image();
      img.onload = () => {
        const rect = drawCanvas.parentElement.getBoundingClientRect();
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = savedCanvas;
    }
  }, 100);
}

function closeNotepad() {
  notepadOverlay.classList.remove("active");
  if (modalOverlay.classList.contains("active")) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "auto";
  }
  currentNoteCardId = null;
}

function loadNote(cardId) {
  noteTextarea.value =
    localStorage.getItem(NOTE_STORAGE_PREFIX + cardId + "_text") || "";
  const savedStyles = localStorage.getItem(
    NOTE_STORAGE_PREFIX + cardId + "_styles",
  );
  if (savedStyles) {
    try {
      const styles = JSON.parse(savedStyles);
      if (styles.fontFamily) {
        fontFamilySelect.value = styles.fontFamily;
        noteTextarea.style.fontFamily = styles.fontFamily;
      }
      if (styles.fontSize) {
        fontSizeSelect.value = styles.fontSize;
        noteTextarea.style.fontSize = styles.fontSize + "px";
      }
      if (styles.color) {
        textColorInput.value = styles.color;
        noteTextarea.style.color = styles.color;
      }
    } catch (e) {
      console.error(e);
    }
  }
  const savedGridSize = localStorage.getItem(
    NOTE_STORAGE_PREFIX + cardId + "_gridsize",
  );
  if (savedGridSize !== null) {
    setGridSize(parseInt(savedGridSize), true);
  }
}

function saveNote() {
  if (!currentNoteCardId) return;
  localStorage.setItem(
    NOTE_STORAGE_PREFIX + currentNoteCardId + "_text",
    noteTextarea.value,
  );
  const styles = {
    fontFamily: fontFamilySelect.value,
    fontSize: fontSizeSelect.value,
    color: textColorInput.value,
  };
  localStorage.setItem(
    NOTE_STORAGE_PREFIX + currentNoteCardId + "_styles",
    JSON.stringify(styles),
  );
  if (drawCanvas) {
    localStorage.setItem(
      NOTE_STORAGE_PREFIX + currentNoteCardId + "_canvas",
      drawCanvas.toDataURL("image/png"),
    );
  }
  const currentGridSize =
    notepadCanvas.style.getPropertyValue("--grid-size") || "20px";
  const gridNum = parseInt(currentGridSize) || 0;
  localStorage.setItem(
    NOTE_STORAGE_PREFIX + currentNoteCardId + "_gridsize",
    gridNum,
  );
  saveNoteBtn.textContent = "✅ ذخیره شد!";
  showToast("💾 یادداشت ذخیره شد.");
  setTimeout(() => {
    saveNoteBtn.textContent = "💾 ذخیره";
  }, 1500);
}

function switchMode(mode) {
  notepadMode = mode;
  if (mode === "text") {
    modeTextBtn.classList.add("active");
    modeDrawBtn.classList.remove("active");
    textTools.classList.remove("hidden");
    drawTools.classList.add("hidden");
    gridTools.classList.add("hidden");
    notepadText.classList.remove("hidden");
    notepadCanvas.classList.add("hidden");
  } else {
    modeDrawBtn.classList.add("active");
    modeTextBtn.classList.remove("active");
    drawTools.classList.remove("hidden");
    gridTools.classList.remove("hidden");
    textTools.classList.add("hidden");
    notepadCanvas.classList.remove("hidden");
    notepadText.classList.add("hidden");
    setTimeout(() => {
      initCanvas();
      if (currentNoteCardId) {
        const savedCanvas = localStorage.getItem(
          NOTE_STORAGE_PREFIX + currentNoteCardId + "_canvas",
        );
        if (savedCanvas) {
          const img = new Image();
          img.onload = () => {
            const rect = drawCanvas.parentElement.getBoundingClientRect();
            ctx.drawImage(img, 0, 0, rect.width, rect.height);
          };
          img.src = savedCanvas;
        }
      }
    }, 50);
  }
}

function setGridSize(size, updateButtons = true) {
  if (!notepadCanvas) return;
  if (size === 0) {
    notepadCanvas.classList.add("grid-hidden");
  } else {
    notepadCanvas.classList.remove("grid-hidden");
    notepadCanvas.style.setProperty("--grid-size", size + "px");
  }
  if (updateButtons) {
    gridSizeBtns.forEach((btn) => {
      btn.classList.toggle("active", parseInt(btn.dataset.gridSize) === size);
    });
  }
}

function getMousePos(e) {
  const rect = drawCanvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return { x: clientX - rect.left, y: clientY - rect.top };
}

function startDrawing(e) {
  isDrawing = true;
  const pos = getMousePos(e);
  lastX = pos.x;
  lastY = pos.y;
}

function draw(e) {
  if (!isDrawing) return;
  e.preventDefault();
  const pos = getMousePos(e);
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(pos.x, pos.y);
  ctx.strokeStyle = isEraser ? "#ffffff" : currentBrushColor;
  ctx.lineWidth = isEraser ? currentBrushSize * 3 : currentBrushSize;
  ctx.stroke();
  lastX = pos.x;
  lastY = pos.y;
}

function stopDrawing() {
  isDrawing = false;
}

/* ============================================================
   23. QUIZ LAUNCHER
   ============================================================ */
if (startQuizBtn) {
  startQuizBtn.addEventListener("click", () => {
    if (allCards.length < 4) {
      showToast("برای شروع آزمون حداقل به ۴ کارت نیاز دارید.", true);
      return;
    }
    window.location.href = `quiz.html?level=${LEVEL}`;
  });
}

/* ============================================================
   24. EVENT LISTENERS
   ============================================================ */
if (addCardBtn) addCardBtn.addEventListener("click", openAddModal);
if (closeAddModal) closeAddModal.addEventListener("click", closeAddModalFunc);
if (addCardForm) addCardForm.addEventListener("submit", handleAddCardSubmit);
if (imageFileInput)
  imageFileInput.addEventListener("change", handleImageUpload);
if (suggestSentenceBtn)
  suggestSentenceBtn.addEventListener("click", suggestSentence);
if (addModalOverlay) {
  addModalOverlay.addEventListener("click", (e) => {
    if (e.target === addModalOverlay) closeAddModalFunc();
  });
}

if (largeFlashcard) {
  largeFlashcard.addEventListener("click", (e) => {
    if (e.target.closest(".speak-btn")) return;
    if (e.target.classList.contains("clickable-image")) return;
    largeFlashcard.classList.toggle("is-flipped");
  });
}
if (closeModal) closeModal.addEventListener("click", closeLargeModal);
if (modalOverlay) {
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeLargeModal();
  });
}

if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    if (allCards.length === 0) return;
    currentIndex = (currentIndex - 1 + allCards.length) % allCards.length;
    updateLargeCard();
  });
}
if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    if (allCards.length === 0) return;
    currentIndex = (currentIndex + 1) % allCards.length;
    updateLargeCard();
  });
}

if (speakCharBtn) {
  speakCharBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const card = allCards[currentIndex];
    if (card) speakText(card.character);
  });
}
if (speakSentenceBtn) {
  speakSentenceBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const card = allCards[currentIndex];
    if (card && card.sentence) speakText(card.sentence);
  });
}

if (editCurrentCardBtn) {
  editCurrentCardBtn.addEventListener("click", () => {
    const card = allCards[currentIndex];
    if (card) openEditModal(card.id);
  });
}
if (deleteCurrentCardBtn) {
  deleteCurrentCardBtn.addEventListener("click", () => {
    const card = allCards[currentIndex];
    if (card) deleteCard(card.id);
  });
}

if (modalImage) {
  modalImage.addEventListener("click", (e) => {
    e.stopPropagation();
    openLightbox(modalImage.src);
  });
}
if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
if (lightboxOverlay) {
  lightboxOverlay.addEventListener("click", (e) => {
    if (e.target === lightboxOverlay) closeLightbox();
  });
}

if (openNoteBtn) openNoteBtn.addEventListener("click", openNotepad);
if (notepadClose) notepadClose.addEventListener("click", closeNotepad);
if (notepadOverlay) {
  notepadOverlay.addEventListener("click", (e) => {
    if (e.target === notepadOverlay) closeNotepad();
  });
}
if (modeTextBtn)
  modeTextBtn.addEventListener("click", () => switchMode("text"));
if (modeDrawBtn)
  modeDrawBtn.addEventListener("click", () => switchMode("draw"));

if (fontFamilySelect) {
  fontFamilySelect.addEventListener("change", () => {
    noteTextarea.style.fontFamily = fontFamilySelect.value;
  });
}
if (fontSizeSelect) {
  fontSizeSelect.addEventListener("change", () => {
    noteTextarea.style.fontSize = fontSizeSelect.value + "px";
  });
}
if (textColorInput) {
  textColorInput.addEventListener("input", () => {
    noteTextarea.style.color = textColorInput.value;
  });
}
if (brushColorInput) {
  brushColorInput.addEventListener("input", () => {
    currentBrushColor = brushColorInput.value;
    isEraser = false;
    eraserBtn.classList.remove("active");
  });
}
if (brushSizeInput) {
  brushSizeInput.addEventListener("input", () => {
    currentBrushSize = parseInt(brushSizeInput.value);
    brushSizeDisplay.textContent = currentBrushSize;
  });
}
if (eraserBtn) {
  eraserBtn.addEventListener("click", () => {
    isEraser = !isEraser;
    eraserBtn.classList.toggle("active", isEraser);
  });
}
if (clearCanvasBtn) {
  clearCanvasBtn.addEventListener("click", () => {
    if (confirm("آیا از پاک کردن نقاشی مطمئن هستید؟")) {
      const rect = drawCanvas.parentElement.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
    }
  });
}

gridSizeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const size = parseInt(btn.dataset.gridSize);
    setGridSize(size, true);
  });
});

if (drawCanvas) {
  drawCanvas.addEventListener("mousedown", startDrawing);
  drawCanvas.addEventListener("mousemove", draw);
  drawCanvas.addEventListener("mouseup", stopDrawing);
  drawCanvas.addEventListener("mouseleave", stopDrawing);
  drawCanvas.addEventListener("touchstart", startDrawing, { passive: false });
  drawCanvas.addEventListener("touchmove", draw, { passive: false });
  drawCanvas.addEventListener("touchend", stopDrawing);
}

if (saveNoteBtn) saveNoteBtn.addEventListener("click", saveNote);

/* ============================================================
   25. KEYBOARD SHORTCUTS
   ============================================================ */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (notepadOverlay && notepadOverlay.classList.contains("active"))
      closeNotepad();
    else if (lightboxOverlay && lightboxOverlay.classList.contains("active"))
      closeLightbox();
    else if (modalOverlay && modalOverlay.classList.contains("active"))
      closeLargeModal();
    else if (addModalOverlay && addModalOverlay.classList.contains("active"))
      closeAddModalFunc();
  }

  // Arrow navigation only if modal open and not typing in input
  if (
    modalOverlay &&
    modalOverlay.classList.contains("active") &&
    (!notepadOverlay || !notepadOverlay.classList.contains("active"))
  ) {
    const tag = document.activeElement.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;

    if (e.key === "ArrowRight") {
      currentIndex = (currentIndex + 1) % allCards.length;
      updateLargeCard();
    } else if (e.key === "ArrowLeft") {
      currentIndex = (currentIndex - 1 + allCards.length) % allCards.length;
      updateLargeCard();
    } else if (e.key === " ") {
      e.preventDefault();
      largeFlashcard.classList.toggle("is-flipped");
    }
  }
});

/* ============================================================
   26. INITIALIZATION
   ============================================================ */
document.addEventListener("DOMContentLoaded", async () => {
  loadCards();
  await loadVoices();

  document.body.addEventListener(
    "click",
    async function initVoice() {
      if (!chineseVoice) await loadVoices();
      document.body.removeEventListener("click", initVoice);
    },
    { once: true },
  );

  console.log("🐼 Chinese Flashcards App initialized!");
  console.log(`📚 HSK Level: ${LEVEL}`);
  console.log(`📇 Total Cards: ${allCards.length}`);
});
