// IMPORTANT: To prevent Next.js build errors, this component MUST be
// imported into your page using next/dynamic with SSR disabled.
//
// Example in your page file (e.g., app/page.tsx):
//
// import dynamic from 'next/dynamic';
//
// const SearchableLangOcr = dynamic(
//   () => import('../components/SearchableLangOcr'), // Adjust path as needed
//   { ssr: false, loading: () => <p>Loading OCR Tool...</p> }
// );

import React, { useState, useRef, useEffect, useCallback } from "react";
import Select, { SingleValue } from "react-select";
import Tesseract from "tesseract.js";

// --- Type Definitions and Constants ---

type LangOption = { value: string; label: string };
type ModeOption = { value: "automatic" | "manual"; label: string };
type LoggerMessage = { status: string; progress?: number };

const ALL_LANGS: LangOption[] = [
  { value: "ara", label: "Arabic" }, { value: "asm", label: "Assamese" }, { value: "ben", label: "Bengali" },
  { value: "bod", label: "Bodo" }, { value: "chi_sim", label: "Chinese (Simplified)" }, { value: "chi_tra", label: "Chinese (Traditional)" },
  { value: "deu", label: "German" }, { value: "eng", label: "English" }, { value: "fra", label: "French" },
  { value: "guj", label: "Gujarati" }, { value: "hin", label: "Hindi" }, { value: "ita", label: "Italian" },
  { value: "jpn", label: "Japanese" }, { value: "kan", label: "Kannada" }, { value: "kor", label: "Korean" },
  { value: "mal", label: "Malayalam" }, { value: "mar", label: "Marathi" }, { value: "nep", label: "Nepali" },
  { value: "nld", label: "Dutch" }, { value: "ori", label: "Odia" }, { value: "osd", label: "Orientation and Script Detection (OSD)" },
  { value: "pan", label: "Punjabi" }, { value: "por", label: "Portuguese" }, { value: "rus", label: "Russian" },
  { value: "san", label: "Sanskrit" }, { value: "snd", label: "Sindhi" }, { value: "spa", label: "Spanish" },
  { value: "swe", label: "Swedish" }, { value: "tam", label: "Tamil" }, { value: "tel", label: "Telugu" },
  { value: "tha", label: "Thai" }, { value: "tur", label: "Turkish" }, { value: "urd", label: "Urdu" },
  { value: "vie", label: "Vietnamese" }
];

const MODE_OPTIONS: ModeOption[] = [
  { value: "automatic", label: "Automatic Detection" },
  { value: "manual", label: "Manual Selection" }
];

const SCRIPT_TO_LANG_MAP: Record<string, string[]> = {
  Arabic: ["ara", "urd"], Bengali: ["ben", "asm"], Devanagari: ["hin", "mar", "nep", "san"],
  Gujarati: ["guj"], Gurmukhi: ["pan"], Han: ["chi_sim", "chi_tra", "jpn"], Kannada: ["kan"],
  Korean: ["kor"], Latin: ["eng", "deu", "fra", "ita", "nld", "por", "spa", "swe", "tur", "vie"],
  Malayalam: ["mal"], Oriya: ["ori"], Tamil: ["tam"], Telugu: ["tel"], Thai: ["tha"],
  Tibetan: ["bod"], Cyrillic: ["rus"],
};

const CONFIDENCE_THRESHOLD = 85;

export default function SearchableLangOcr() {
  const [file, setFile] = useState<File | null>(null);
  const [lang, setLang] = useState<LangOption | null>(ALL_LANGS.find((l) => l.value === "eng") || null);
  const [mode, setMode] = useState<ModeOption>(MODE_OPTIONS[0]);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("Initializing worker...");
  const [fullText, setFullText] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState("");
  const workerRef = useRef<Tesseract.Worker | null>(null);
  const cancelFlag = useRef(false);

  useEffect(() => {
    const initializeWorker = async () => {
      const worker = await Tesseract.createWorker({
        langPath: "/tessdata",
        corePath: "/tesseract-core/tesseract-core.wasm.js",
        logger: (m: LoggerMessage) => {
          if (cancelFlag.current) return;
          if (m.status === "recognizing text" && m.progress) {
            setProgress(Math.round(m.progress * 100));
          }
          setProgressLabel(m.status);
        },
      });
      workerRef.current = worker;
      setProgressLabel("Worker ready. Please upload an image.");
    };

    initializeWorker();

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const resetState = useCallback((clearFile = false) => {
    cancelFlag.current = true;
    setLoading(false);
    setProgress(0);
    setProgressLabel("Operation cancelled or form cleared.");
    setFullText("");
    setImageError("");
    if (clearFile) {
      setFile(null);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    resetState();
    cancelFlag.current = false;
    const selectedFile = e.target.files?.[0] ?? null;
    if (!selectedFile) { setFile(null); return; }

    const url = URL.createObjectURL(selectedFile);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width < 30 || img.height < 30) {
        setImageError("Image too small. Please upload one at least 30x30 pixels.");
        setFile(null);
      } else {
        setFile(selectedFile);
        setProgressLabel("Image loaded. Ready to analyze.");
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setImageError("Could not read image file. Please upload a valid image.");
      setFile(null);
    };
    img.src = url;
  };

  const onModeChange = (option: SingleValue<ModeOption>) => {
    if (!option) return;
    resetState();
    setMode(option);
  };

  const processImage = useCallback(async (language: string | 'osd', isAutoDetect: boolean) => {
    if (!file || !workerRef.current) return;
    setLoading(true);
    setFullText("");
    setImageError("");
    setProgress(0);
    cancelFlag.current = false;

    try {
      await workerRef.current.loadLanguage(language);
      await workerRef.current.initialize(language);
      const { data } = await workerRef.current.recognize(file);
      if (cancelFlag.current) return;

      if (isAutoDetect) {
        const script = (data as any).script;
        const candidateLangs = SCRIPT_TO_LANG_MAP[script] || [];
        if (candidateLangs.length === 0) throw new Error(`No languages found for script: ${script}`);
        
        let bestMatch = { lang: null as LangOption | null, confidence: 0, text: "" };
        for (const langCode of candidateLangs) {
            if (cancelFlag.current) break;
            // Recursively call to process with specific language
            const result = await processImage(langCode, false) as Tesseract.RecognizeResult;
            if (result && result.data.confidence > bestMatch.confidence) {
                bestMatch = { lang: ALL_LANGS.find(l => l.value === langCode)!, confidence: result.data.confidence, text: result.data.text };
            }
        }
        
        if (bestMatch.lang && bestMatch.confidence > CONFIDENCE_THRESHOLD) {
            setLang(bestMatch.lang);
            setFullText(bestMatch.text.trim());
            setProgressLabel(`Auto-detected: ${bestMatch.lang.label} (Confidence: ${Math.round(bestMatch.confidence)}%)`);
        } else {
            setImageError("Automatic detection failed. Please try manual selection.");
        }
      } else {
        const cleanText = data.text.trim();
        setFullText(cleanText);
        setProgressLabel(cleanText.length > 3 ? "Analysis Complete" : "No significant text detected.");
        if (cleanText.length < 3) setImageError("No text found. Try a clearer image.");
        return { data }; // Return data for auto-detect loop
      }
    } catch (e) {
      if (!cancelFlag.current) {
        setImageError("An error occurred during OCR. Please check console for details.");
      }
    } finally {
      if (!cancelFlag.current) setLoading(false);
    }
  }, [file]);

  const isBusy = loading || !workerRef.current;

  return (
    <div className="container" aria-live="polite">
      <h1>Searchable Language OCR</h1>
      
      <div className="instructions">
        <p><b>Instructions:</b> Upload a clear image, select a mode, and run the analysis. For best results, use sharp images with good contrast. If automatic detection is inaccurate, switch to manual mode.</p>
      </div>

      <div className="controls">
        <div className="mode-select-wrapper">
          <label htmlFor="mode-select">Select Mode:</label>
          <Select inputId="mode-select" options={MODE_OPTIONS} value={mode} onChange={onModeChange} isDisabled={isBusy} />
        </div>

        <div className="uploadArea">
          <input type="file" accept="image/*" onChange={onFileChange} id="file-upload" disabled={isBusy} />
          <label htmlFor="file-upload" className={`fileInputLabel${isBusy ? " disabled" : ""}`}>
            {file ? file.name : "Choose Image"}
          </label>
        </div>
      </div>
      
      {mode.value === "manual" && (
        <div className="actions">
          <div className="lang-select-wrapper">
            <label htmlFor="lang-select">Select OCR Language:</label>
            <Select inputId="lang-select" options={ALL_LANGS.filter(l => l.value !== 'osd')} value={lang} onChange={option => setLang(option as LangOption)} isDisabled={isBusy} />
          </div>
          <button onClick={() => processImage(lang!.value, false)} disabled={!file || !lang || isBusy}>
            {loading ? "Analyzing..." : "Analyze Image"}
          </button>
        </div>
      )}

      {mode.value === "automatic" && (
        <div className="actions">
          <button onClick={() => processImage('osd', true)} disabled={!file || isBusy}>
            {loading ? "Detecting..." : "Detect Language"}
          </button>
        </div>
      )}

      <div className="analysisSection">
        {progressLabel && <div className="progressLabel">{progressLabel}</div>}
        {loading && <progress value={progress} max="100" style={{ width: "100%", marginTop: "10px" }} />}
        {imageError && <div className="errorMsg">{imageError}</div>}
        
        {fullText && !loading && (
          <>
            <h3>Extracted Text</h3>
            <div className="extractedText">{fullText}</div>
          </>
        )}
      </div>

      <div className="actions bottom-actions">
        {loading && <button onClick={() => resetState()} className="cancel">Cancel</button>}
        <button onClick={() => resetState(true)} className="clear" disabled={loading}>Clear All</button>
      </div>
    </div>
  );
}
