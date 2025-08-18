import React, { useState, useRef, useEffect } from "react";
import Select, { SingleValue } from "react-select";
import Tesseract from "tesseract.js";

type LangOption = { value: string; label: string };
const ALL_LANGS: LangOption[] = [
  { value: "ara", label: "Arabic" },
  { value: "asm", label: "Assamese" },
  { value: "ben", label: "Bengali" },
  { value: "bod", label: "Bodo" },
  { value: "chi_sim", label: "Chinese (Simplified)" },
  { value: "chi_tra", label: "Chinese (Traditional)" },
  { value: "deu", label: "German" },
  { value: "eng", label: "English" },
  { value: "fra", label: "French" },
  { value: "guj", label: "Gujarati" },
  { value: "hin", label: "Hindi" },
  { value: "ita", label: "Italian" },
  { value: "jpn", label: "Japanese" },
  { value: "kan", label: "Kannada" },
  { value: "kor", label: "Korean" },
  { value: "mal", label: "Malayalam" },
  { value: "mar", label: "Marathi" },
  { value: "nep", label: "Nepali" },
  { value: "nld", label: "Dutch" },
  { value: "ori", label: "Odia" },
  { value: "osd", label: "Orientation and Script Detection (OSD)" },
  { value: "pan", label: "Punjabi" },
  { value: "por", label: "Portuguese" },
  { value: "rus", label: "Russian" },
  { value: "san", label: "Sanskrit" },
  { value: "snd", label: "Sindhi" },
  { value: "spa", label: "Spanish" },
  { value: "swe", label: "Swedish" },
  { value: "tam", label: "Tamil" },
  { value: "tel", label: "Telugu" },
  { value: "tha", label: "Thai" },
  { value: "tur", label: "Turkish" },
  { value: "urd", label: "Urdu" },
  { value: "vie", label: "Vietnamese" },
];

// Group languages into logical sets for prioritized detection
const LANG_GROUPS: LangOption[][] = [
  // Group 1: Common Western/Latin languages
  [
    { value: "eng", label: "English" },
    { value: "spa", label: "Spanish" },
    { value: "fra", label: "French" },
    { value: "deu", label: "German" },
    { value: "nld", label: "Dutch" },
    { value: "ita", label: "Italian" },
    { value: "por", label: "Portuguese" },
    { value: "swe", label: "Swedish" },
    { value: "tur", label: "Turkish" },
  ],

  // Group 2: Indian subcontinent languages
  [
    { value: "hin", label: "Hindi" },
    { value: "tam", label: "Tamil" },
    { value: "tel", label: "Telugu" },
    { value: "mal", label: "Malayalam" },
    { value: "mar", label: "Marathi" },
    { value: "guj", label: "Gujarati" },
    { value: "ori", label: "Odia" },
    { value: "pan", label: "Punjabi" },
    { value: "san", label: "Sanskrit" },
    { value: "asm", label: "Assamese" },
    { value: "ben", label: "Bengali" },
    { value: "nep", label: "Nepali" },
    { value: "snd", label: "Sindhi" },
    { value: "bod", label: "Bodo" },
    { value: "kan", label: "Kannada" },
  ],

  // Group 3: East Asian languages
  [
    { value: "chi_sim", label: "Chinese (Simplified)" },
    { value: "chi_tra", label: "Chinese (Traditional)" },
    { value: "jpn", label: "Japanese" },
    { value: "kor", label: "Korean" },
  ],

  // Group 4: Other languages
  [
    { value: "ara", label: "Arabic" },
    { value: "rus", label: "Russian" },
    { value: "tha", label: "Thai" },
    { value: "vie", label: "Vietnamese" },
  ],
];

type LoggerMessage = { status: string; progress?: number };
const CONFIDENCE_THRESHOLD = 85;

type ModeOption = { value: "automatic" | "manual"; label: string };
const MODE_OPTIONS: ModeOption[] = [
  { value: "automatic", label: "Automatic Detection" },
  { value: "manual", label: "Manual Selection" },
];

export default function SearchableLangOcr() {
  const [file, setFile] = useState<File | null>(null);
  const [lang, setLang] = useState<LangOption | null>(
    ALL_LANGS.find((l) => l.value === "eng") || null
  );
  const [mode, setMode] = useState<ModeOption>(MODE_OPTIONS[0]);
  const [progress, setProgress] = useState<string>("");
  const [fullText, setFullText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState<string>("");
  const cancelFlag = useRef(false);

  useEffect(() => {
    if (file && mode.value === "automatic") {
      autoDetectLanguageByConfidence(file);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, mode]);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFullText("");
    setProgress("");
    setImageError("");
    cancelFlag.current = false;
    const selectedFile = e.target.files?.[0] ?? null;

    if (!selectedFile) {
      setFile(null);
      return;
    }
    const img = new window.Image();
    const url = URL.createObjectURL(selectedFile);
    img.onload = () => {
      if (img.width < 30 || img.height < 30) {
        setFile(null);
        setImageError("Image too small. Please upload an image at least 30x30 pixels.");
        URL.revokeObjectURL(url);
      } else {
        setFile(selectedFile);
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      setFile(null);
      setImageError("Could not read image file. Please upload a valid image.");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const onLangChange = (option: SingleValue<LangOption>) => {
    setLang(option ?? null);
  };

  const autoDetectLanguageByConfidence = async (file: File) => {
    setProgress("Auto-detecting language...");
    setLoading(true);
    setImageError("");
    cancelFlag.current = false;
    setFullText("");

    const url = URL.createObjectURL(file);
    let best = { lang: null as LangOption | null, confidence: 0, text: "" };

    try {
      outer: for (const group of LANG_GROUPS) {
        for (const langOpt of group) {
          if (cancelFlag.current) break outer;

          setProgress(`Trying ${langOpt.label}...`);

          const { data } = await Tesseract.recognize(url, langOpt.value, {
            langPath: "/tessdata",
            corePath: "/tesseract-core/tesseract-core.wasm.js",
          });

          if (cancelFlag.current) break outer;

          const confidence = data.confidence ?? 0;
          const text = data.text.trim();

          if (confidence > best.confidence && text.length > 3) {
            best = { lang: langOpt, confidence, text };
          }

          if (confidence >= CONFIDENCE_THRESHOLD) {
            setLang(langOpt);
            setFullText(text);
            setProgress(
              `Auto-detect: Best match is ${langOpt.label} (confidence: ${Math.round(
                confidence
              )})`
            );
            break outer; // Early stop on confident detection
          }
        }
      }

      if (!best.lang) {
        setLang(ALL_LANGS.find((l) => l.value === "eng") || null);
        setProgress("Could not auto-detect language. Please select manually.");
        setImageError("Automatic detection failed. Please choose OCR language below.");
      } else if (best.confidence < CONFIDENCE_THRESHOLD) {
        setLang(best.lang);
        setFullText(best.text);
        setProgress(
          `Auto-detect: Best available match is ${best.lang.label} (confidence: ${Math.round(
            best.confidence
          )})`
        );
      }
    } catch (e) {
      if (cancelFlag.current) {
        setProgress("Auto-detection cancelled.");
      } else {
        setProgress("Auto-detection error. Please select manually.");
        setImageError("Script detection failed (see console).");
      }
    } finally {
      setLoading(false);
      URL.revokeObjectURL(url);
    }
  };

  const onAnalyze = async () => {
    if (!file || !lang) return;
    setProgress("Starting OCR...");
    setFullText("");
    setLoading(true);
    setImageError("");
    cancelFlag.current = false;

    const url = URL.createObjectURL(file);
    try {
      const { data } = await Tesseract.recognize(url, lang.value, {
        logger: (m: LoggerMessage) => {
          if (cancelFlag.current) return;
          if (m.status === "recognizing text") {
            setProgress(`OCR: ${Math.round((m.progress ?? 0) * 100)}%`);
          } else {
            setProgress(m.status);
          }
        },
        langPath: "/tessdata",
        corePath: "/tesseract-core/tesseract-core.wasm.js",
      });

      if (cancelFlag.current) {
        setProgress("OCR cancelled.");
        setLoading(false);
        URL.revokeObjectURL(url);
        return;
      }

      URL.revokeObjectURL(url);
      const cleanText = data.text.trim();
      setFullText(cleanText);
      setProgress("Analysis Complete");
      if (cleanText.length < 3) setImageError("No text detected! Please try a clearer image.");
    } catch {
      if (cancelFlag.current) {
        setProgress("OCR cancelled.");
      } else {
        setProgress("Error during OCR");
        setImageError("OCR failed. Check your file and language.");
      }
    } finally {
      setLoading(false);
    }
  };

  const cancelOcrProcess = () => {
    cancelFlag.current = true;
    setLoading(false);
    setProgress("Operation cancelled.");
  };

  const onClear = () => {
    cancelFlag.current = true;
    setFile(null);
    setLang(ALL_LANGS.find((l) => l.value === "eng") || null);
    setFullText("");
    setProgress("");
    setImageError("");
    setLoading(false);
  };

  const onModeChange = (option: SingleValue<ModeOption>) => {
    if (!option) return;
    cancelFlag.current = true; // Cancel ongoing OCR/detection on mode switch
    setMode(option);
    setProgress("");
    setFullText("");
    setImageError("");
    setLoading(false);
  };

  return (
    <div className="container" aria-live="polite">
      <h1 className="title">Searchable Language OCR</h1>

      <div className="instructions">
        <p>
          <b>Instructions:</b> Upload a clear image containing text and choose between automatic or manual mode.
          In automatic mode, the app detects the language for you. In manual mode, you select the language yourself
          to improve accuracy with complex scripts.
        </p>
        <p>
          This app supports over 30 languages including Hindi, Telugu, Tamil, Chinese, and Russian.
          You can switch between modes anytime for flexibility. A cancel button lets you stop any ongoing process.
        </p>
        <p>
          You’ll receive live progress updates and clear error messages if the image is too small, blurry, or unreadable.
          The extracted text will be displayed below, ready to review or copy.
        </p>
        <p>
          For best results, upload sharp images with good contrast and text size at least 30×30 pixels.
          If automatic detection isn’t accurate, try manual mode and specify the language yourself.
        </p>
      </div>

      <div className="mode-select-wrapper">
        <label htmlFor="mode-select" className="mode-select-label">
          Select Mode:
        </label>
        <div className="mode-select">
          <Select
            inputId="mode-select"
            options={MODE_OPTIONS}
            value={mode}
            onChange={onModeChange}
            isClearable={false}
          />
        </div>
      </div>

      <div className="uploadArea">
        <input
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="fileInput"
          id="file-upload"
          disabled={loading}
        />
        <label htmlFor="file-upload" className={`fileInputLabel${loading ? " disabled" : ""}`}>
          {file ? file.name : "Choose Image"}
        </label>
      </div>

      {mode.value === "manual" && (
        <>
          <div className="lang-select-wrapper">
            <label htmlFor="lang-select" className="lang-select-label">
              Select OCR Language:
            </label>
            <div className="lang-select">
              <Select
                inputId="lang-select"
                options={ALL_LANGS.filter((l) => l.value !== "osd")}
                value={lang}
                onChange={onLangChange}
                placeholder="Search or scroll to choose language..."
                isClearable={false}
                isDisabled={loading}
              />
            </div>
          </div>

          <div className="actions">
            <button
              onClick={onAnalyze}
              disabled={!file || loading || !lang}
              className={`uploadButton${!file || loading || !lang ? " disabled" : ""}`}
              aria-disabled={!file || loading || !lang}
            >
              {loading ? "Analyzing..." : "Analyze"}
            </button>

            {loading && (
              <button
                onClick={cancelOcrProcess}
                className="uploadButton cancel"
                aria-label="Cancel ongoing OCR or detection"
              >
                Cancel
              </button>
            )}

            <button
              onClick={onClear}
              className="uploadButton clear"
              disabled={loading}
              aria-label="Clear form"
            >
              Clear
            </button>
          </div>
        </>
      )}

      {mode.value === "automatic" && (
        <div className="actions">
          {loading && (
            <button
              onClick={cancelOcrProcess}
              className="uploadButton cancel"
              aria-label="Cancel ongoing OCR or detection"
            >
              Cancel
            </button>
          )}
          <button
            onClick={onClear}
            className="uploadButton clear"
            disabled={loading}
            aria-label="Clear form"
          >
            Clear
          </button>
        </div>
      )}

      {imageError && <div className="errorMsg">{imageError}</div>}

      <div className="analysisSection" aria-live="polite">
        {progress && <div className="fileDetails">{progress}</div>}
        {fullText && !loading && (
          <>
            <h3 className="analysisTitle">Extracted Text</h3>
            <div className="extractedText">{fullText}</div>
          </>
        )}
      </div>
    </div>
  );
}
