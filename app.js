/* =========================================================================
   LinguaShift — AI Language Translation Tool
   CodeAlpha AI Internship · Task 1
   -------------------------------------------------------------------------
   - Lets the user enter text and pick source & target languages
   - Sends text to a translation API (MyMemory) and shows the result
   - Extras: language swap, auto-translate, copy button, text-to-speech
   ========================================================================= */

// ---- Config --------------------------------------------------------------
// Set to true to route translations through the optional Flask backend
// (backend/app.py, Google Translate). Leave false to use the key-less
// MyMemory API directly from the browser — works with zero setup.
const USE_BACKEND = false;
const BACKEND_URL = "http://localhost:5000/translate";

// ---- Supported languages (ISO 639-1 codes) -------------------------------
const LANGUAGES = [
  { code: "auto", name: "Detect language" },
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "nl", name: "Dutch" },
  { code: "ru", name: "Russian" },
  { code: "uk", name: "Ukrainian" },
  { code: "pl", name: "Polish" },
  { code: "tr", name: "Turkish" },
  { code: "ar", name: "Arabic" },
  { code: "he", name: "Hebrew" },
  { code: "hi", name: "Hindi" },
  { code: "bn", name: "Bengali" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "ur", name: "Urdu" },
  { code: "fa", name: "Persian" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "th", name: "Thai" },
  { code: "vi", name: "Vietnamese" },
  { code: "id", name: "Indonesian" },
  { code: "ms", name: "Malay" },
  { code: "sw", name: "Swahili" },
  { code: "el", name: "Greek" },
  { code: "sv", name: "Swedish" },
  { code: "fi", name: "Finnish" },
  { code: "no", name: "Norwegian" },
  { code: "da", name: "Danish" },
  { code: "cs", name: "Czech" },
  { code: "ro", name: "Romanian" },
  { code: "hu", name: "Hungarian" },
];

// ---- DOM references -------------------------------------------------------
const $ = (id) => document.getElementById(id);
const sourceLang   = $("sourceLang");
const targetLang   = $("targetLang");
const sourceText   = $("sourceText");
const targetText   = $("targetText");
const placeholder  = $("placeholder");
const charCount    = $("charCount");
const detectedNote = $("detectedNote");
const errorMsg     = $("errorMsg");
const translateBtn = $("translateBtn");
const btnLabel     = $("btnLabel");
const btnSpinner   = $("btnSpinner");
const toast        = $("toast");

// ---- Populate the language dropdowns -------------------------------------
function fillSelect(select, includeAuto, selectedCode) {
  select.innerHTML = "";
  LANGUAGES.forEach((lang) => {
    if (!includeAuto && lang.code === "auto") return;
    const opt = document.createElement("option");
    opt.value = lang.code;
    opt.textContent = lang.name;
    if (lang.code === selectedCode) opt.selected = true;
    select.appendChild(opt);
  });
}
fillSelect(sourceLang, true, "auto");   // source allows auto-detect
fillSelect(targetLang, false, "es");    // default target: Spanish

// ---- Helpers -------------------------------------------------------------
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1800);
}

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.classList.remove("hidden");
}
function clearError() {
  errorMsg.classList.add("hidden");
}

function setLoading(isLoading) {
  translateBtn.disabled = isLoading;
  btnLabel.textContent = isLoading ? "Translating…" : "Translate";
  btnSpinner.classList.toggle("hidden", !isLoading);
}

function getTranslatedText() {
  // Returns the plain text currently shown in the target panel (if any)
  return targetText.dataset.value || "";
}

// ---- Core: call the translation API --------------------------------------
async function translate() {
  const text = sourceText.value.trim();
  clearError();

  if (!text) {
    showError("Please enter some text to translate.");
    return;
  }

  let from = sourceLang.value;
  const to = targetLang.value;

  if (from !== "auto" && from === to) {
    showError("Source and target languages are the same.");
    return;
  }

  setLoading(true);
  detectedNote.textContent = "";

  try {
    let translated;

    if (USE_BACKEND) {
      // ---- Option A: Flask backend (Google Translate) ----
      const res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, source: from, target: to }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `API responded with ${res.status}`);
      translated = data.translated;
      renderResult(translated);
    } else {
      // ---- Option B: MyMemory API (no key, runs in browser) ----
      // MyMemory needs a concrete source code. "auto" -> "Autodetect"
      const langpair = `${from === "auto" ? "Autodetect" : from}|${to}`;
      const url =
        "https://api.mymemory.translated.net/get?q=" +
        encodeURIComponent(text) +
        "&langpair=" +
        encodeURIComponent(langpair);

      const res = await fetch(url);
      if (!res.ok) throw new Error(`API responded with ${res.status}`);
      const data = await res.json();
      if (data.responseStatus && data.responseStatus !== 200) {
        throw new Error(data.responseDetails || "Translation failed.");
      }

      translated = data.responseData.translatedText;
      renderResult(translated);

      // Surface detected language when auto-detect was used
      const detected = data?.responseData?.detectedLanguage;
      if (from === "auto" && detected) {
        const found = LANGUAGES.find((l) => l.code === detected);
        detectedNote.textContent =
          "Detected: " + (found ? found.name : detected);
      }
    }
  } catch (err) {
    showError("Could not translate: " + err.message);
  } finally {
    setLoading(false);
  }
}

function renderResult(text) {
  targetText.dataset.value = text;
  targetText.textContent = text;
  placeholder.style.display = "none";
}

// ---- Text-to-speech (Web Speech API) -------------------------------------
function speak(text, langCode) {
  if (!("speechSynthesis" in window)) {
    showToast("Text-to-speech not supported in this browser");
    return;
  }
  if (!text) {
    showToast("Nothing to read");
    return;
  }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  if (langCode && langCode !== "auto") utter.lang = langCode;
  window.speechSynthesis.speak(utter);
}

// ---- Copy to clipboard ---------------------------------------------------
async function copyResult() {
  const text = getTranslatedText();
  if (!text) {
    showToast("Nothing to copy");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast("Copied to clipboard ✓");
  } catch {
    // Fallback for older browsers
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    showToast("Copied to clipboard ✓");
  }
}

// ---- Swap languages ------------------------------------------------------
function swapLanguages() {
  if (sourceLang.value === "auto") {
    showToast("Pick a specific source language to swap");
    return;
  }
  const tmp = sourceLang.value;
  sourceLang.value = targetLang.value;
  targetLang.value = tmp;

  // Also swap the text if there's a translation already
  const translated = getTranslatedText();
  if (translated) {
    sourceText.value = translated;
    targetText.dataset.value = "";
    targetText.textContent = "";
    placeholder.style.display = "";
    updateCharCount();
  }
}

// ---- Char counter --------------------------------------------------------
function updateCharCount() {
  charCount.textContent = `${sourceText.value.length} / 5000`;
}

// ---- Debounced auto-translate --------------------------------------------
let debounceTimer = null;
function scheduleAutoTranslate() {
  if (!$("autoTranslate").checked) return;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(translate, 700);
}

// ---- Event wiring --------------------------------------------------------
translateBtn.addEventListener("click", translate);
$("swapBtn").addEventListener("click", swapLanguages);
$("copyBtn").addEventListener("click", copyResult);
$("clearBtn").addEventListener("click", () => {
  sourceText.value = "";
  targetText.dataset.value = "";
  targetText.textContent = "";
  placeholder.style.display = "";
  detectedNote.textContent = "";
  updateCharCount();
  clearError();
  sourceText.focus();
});
$("speakSource").addEventListener("click", () =>
  speak(sourceText.value, sourceLang.value)
);
$("speakTarget").addEventListener("click", () =>
  speak(getTranslatedText(), targetLang.value)
);

sourceText.addEventListener("input", () => {
  updateCharCount();
  scheduleAutoTranslate();
});

// Ctrl/Cmd + Enter to translate
sourceText.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    translate();
  }
});

// Init
updateCharCount();
