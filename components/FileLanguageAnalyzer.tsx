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
  { value: "vie", label: "Vietnamese" }
];

const AUTODETECT_LANGS = ALL_LANGS.filter((l) => l.value !== "osd");
type LoggerMessage = { status: string; progress?: number };
const CONFIDENCE_THRESHOLD = 85;

type ModeOption = { value: "automatic" | "manual"; label: string };
const MODE_OPTIONS: ModeOption[] = [
  { value: "automatic", label: "Automatic Detection" },
  { value: "manual", label: "Manual Selection" }
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
      for (const langOpt of AUTODETECT_LANGS) {
        if (cancelFlag.current) break;
        setProgress(`Trying ${langOpt.label}...`);

        const { data } = await Tesseract.recognize(url, langOpt.value, {
          langPath: "/tessdata",
          corePath: "/tesseract-core/tesseract-core.wasm.js"
        });

        if (cancelFlag.current) break;

        if (data.confidence > best.confidence && data.text.trim().length > 3) {
          best = { lang: langOpt, confidence: data.confidence, text: data.text };
          if (best.confidence >= CONFIDENCE_THRESHOLD) break;
        }
      }

      if (cancelFlag.current) {
        setProgress("Auto-detect cancelled.");
      } else if (best.lang) {
        setLang(best.lang);
        setFullText(best.text.trim());
        setProgress(
          `Auto-detect: Best match is ${best.lang.label} (confidence: ${Math.round(
            best.confidence
          )}).`
        );
      } else {
        setLang(ALL_LANGS.find((l) => l.value === "eng") || null);
        setProgress("Could not auto-detect language. Please select manually.");
        setImageError("Automatic detection failed. Please choose OCR language below.");
      }
    } catch (e) {
      if (cancelFlag.current) {
        setProgress("Auto-detection cancelled.");
      } else {
        setLang(ALL_LANGS.find((l) => l.value === "eng") || null);
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
        corePath: "/tesseract-core/tesseract-core.wasm.js"
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
    cancelFlag.current = true; // Cancel any ongoing OCR/detect for mode switch
    setMode(option);
    setProgress("");
    setFullText("");
    setImageError("");
    setLoading(false);
  };

  return (
    <div className="container" aria-live="polite" style={{ maxWidth: 600, margin: "auto" }}>
      <h1 className="title">Searchable Language OCR</h1>
<div className="instructions" style={{ marginBottom: 18 }}>
  <p>
    <b>How it works:</b> Upload an image containing text and choose between two powerful modes:<br />
    <span style={{ color: "#006699" }}>
      <b>Automatic Detection</b>: The app will scan your image using advanced OCR technology and intelligently detect the language.<br />
      <b>Manual Selection</b>: You can pick the expected language yourself for higher accuracy, especially with complex or stylized scripts.
    </span>
  </p>
  <ul style={{ marginLeft: 0, paddingLeft: 20, color: "#333" }}>
    <li>
      <b>Supports 30+ languages:</b> Recognizes most South Asian and international scripts, including Hindi, Telugu, Tamil, Chinese, Russian, and more.
    </li>
    <li>
      <b>Flexible modes:</b> Quickly switch between automatic detection or manual pick using the mode selector.
    </li>
    <li>
      <b>Cancel anytime:</b> Stop an ongoing analysis or detection with the <span style={{ color: "#bb0000" }}><b>Cancel</b></span> button for convenience.
    </li>
    <li>
      <b>Error Handling:</b> Instant feedback if your file is too small, unreadable, or contains no clear text.
    </li>
    <li>
      <b>Live progress updates:</b> Track what the app is doing with clear progress messages during detection and analysis.
    </li>
    <li>
      <b>Mobile-friendly:</b> Works smoothly on desktop and mobile browsers.
    </li>
    <li>
      <b>Clear results display:</b> Extracted text appears below your image, ready to copy or review.
    </li>
  </ul>
  <p>
    <b>Tips for best results:</b>
    <ul style={{ marginLeft: 0, paddingLeft: 20 }}>
      <li>Upload sharp images with good contrast and text at least <span style={{ fontWeight: 600 }}>30×30 pixels</span>.</li>
      <li>For multi-language images, try both modes to see which gives better accuracy.</li>
      <li>If detection fails, switch to manual and specify the language yourself.</li>
    </ul>
  </p>
</div>


      <div
        style={{
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap"
        }}>
        <label
          htmlFor="mode-select"
          style={{ fontWeight: 600, whiteSpace: "nowrap" }}
        >
          Select Mode:
        </label>
        <div style={{ minWidth: 200, flexGrow: 1, maxWidth: 300 }}>
          <Select
            inputId="mode-select"
            options={MODE_OPTIONS}
            value={mode}
            onChange={onModeChange}
            isClearable={false}
            styles={{
              control: (provided) => ({
                ...provided,
                minHeight: 36,
                borderRadius: 6,
                boxShadow: "0 0 5px rgba(0,0,0,0.1)",
                borderColor: "#ccc",
                "&:hover": { borderColor: "#999" }
              }),
              menu: (provided) => ({
                ...provided,
                borderRadius: 6
              })
            }}
          />
        </div>
      </div>

      <div className="uploadArea" style={{ marginBottom: 12 }}>
        <input
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="fileInput"
          id="file-upload"
          disabled={loading}
          style={{ marginBottom: 8 }}
        />
        <label
          htmlFor="file-upload"
          className="fileInputLabel"
          style={{ cursor: loading ? "not-allowed" : "pointer" }}
        >
          {file ? file.name : "Choose Image"}
        </label>
      </div>

      {/* MANUAL MODE UI */}
      {mode.value === "manual" && (
        <div>
          <div
            style={{
              marginBottom: 20,
              maxWidth: 480,
              display: "flex",
              alignItems: "center"
            }}
          >
            <label
              htmlFor="lang-select"
              style={{
                fontWeight: 600,
                marginRight: 12,
                minWidth: 140,
                whiteSpace: "nowrap",
                userSelect: "none"
              }}
            >
              Select OCR Language:
            </label>
            <div style={{ flex: 1 }}>
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

          <div>
            <button
              onClick={onAnalyze}
              disabled={!file || loading || !lang}
              className={`uploadButton${!file || loading || !lang ? " disabled" : ""}`}
              aria-disabled={!file || loading || !lang}
              style={{
                marginRight: 12,
                padding: "8px 20px",
                cursor: !file || loading || !lang ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "Analyzing..." : "Analyze"}
            </button>

            {loading && (
              <button
                onClick={cancelOcrProcess}
                className="uploadButton"
                style={{
                  background: "#ff4444",
                  color: "#fff",
                  padding: "8px 20px",
                  cursor: "pointer"
                }}
                aria-label="Cancel ongoing OCR or detection"
              >
                Cancel
              </button>
            )}

            <button
              onClick={onClear}
              className="uploadButton"
              disabled={loading}
              style={{
                background: "#ccc",
                color: "#333",
                padding: "8px 20px",
                marginLeft: 12,
                cursor: loading ? "not-allowed" : "pointer"
              }}
              aria-label="Clear form"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* AUTOMATIC MODE UI */}
      {mode.value === "automatic" && (
        <div>
          {loading && (
            <button
              onClick={cancelOcrProcess}
              className="uploadButton"
              style={{
                background: "#ff4444",
                color: "#fff",
                padding: "8px 20px",
                margin: "16px 0",
                cursor: "pointer"
              }}
              aria-label="Cancel ongoing OCR or detection"
            >
              Cancel
            </button>
          )}
          <button
            onClick={onClear}
            className="uploadButton"
            disabled={loading}
            style={{
              background: "#ccc",
              color: "#333",
              padding: "8px 20px",
              marginLeft: 12,
              cursor: loading ? "not-allowed" : "pointer"
            }}
            aria-label="Clear form"
          >
            Clear
          </button>
        </div>
      )}

      {imageError && (
        <div className="errorMsg" style={{ marginTop: 20, color: "#c00" }}>
          {imageError}
        </div>
      )}

      <div className="analysisSection" aria-live="polite" style={{ marginTop: 24 }}>
        {progress && (
          <div className="fileDetails" style={{ marginBottom: 8 }}>
            {progress}
          </div>
        )}
        {fullText && !loading && (
          <>
            <h3 className="analysisTitle">Extracted Text</h3>
            <div
              style={{
                background: "#fff5ec",
                color: "#333",
                borderRadius: 10,
                padding: 15,
                boxShadow: "0 2px 10px #ffdbe688",
                fontSize: 16,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                maxHeight: 350,
                overflowY: "auto"
              }}
            >
              {fullText}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
