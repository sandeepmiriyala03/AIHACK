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
  Arabic: ["ara", "urd"],
  Bengali: ["ben", "asm"],
  Devanagari: ["hin", "mar", "nep", "san"],
  Gujarati: ["guj"],
  Gurmukhi: ["pan"],
  Han: ["chi_sim", "chi_tra", "jpn"],
  Kannada: ["kan"],
  Korean: ["kor"],
  Latin: ["eng", "deu", "fra", "ita", "nld", "por", "spa", "swe", "tur", "vie"],
  Malayalam: ["mal"],
  Oriya: ["ori"],
  Tamil: ["tam"],
  Telugu: ["tel"],
  Thai: ["tha"],
  Tibetan: ["bod"],
  Cyrillic: ["rus"],
};

const CONFIDENCE_THRESHOLD = 85;

// --- Component ---

export default function SearchableLangOcr() {
  // --- State Management ---
  const [file, setFile] = useState<File | null>(null);
  const [lang, setLang] = useState<LangOption | null>(ALL_LANGS.find((l) => l.value === "eng") || null);
  const [mode, setMode] = useState<ModeOption>(MODE_OPTIONS[0]);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [fullText, setFullText] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [worker, setWorker] = useState<Tesseract.Worker | null>(null);
  const cancelFlag = useRef(false);

  // --- Worker Initialization and Termination ---
  const initializeWorker = useCallback(async () => {
    const tesseractWorker = await Tesseract.createWorker({
      langPath: "/tessdata",
      corePath: "/tesseract-core/tesseract-core.wasm.js",
      logger: (m: LoggerMessage) => {
        if (cancelFlag.current) return;
        if (m.status === "recognizing text") {
          setProgress(Math.round((m.progress ?? 0) * 100));
        }
        setProgressLabel(m.status);
      },
    });
    setWorker(tesseractWorker);
  }, []);

  useEffect(() => {
    initializeWorker();
    return () => {
      worker?.terminate();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // --- Utility and Reset Functions ---
  const resetState = useCallback((clearFile = false) => {
    cancelFlag.current = true;
    setLoading(false);
    setProgress(0);
    setProgressLabel("");
    setFullText("");
    setImageError("");
    if (clearFile) {
        setFile(null);
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if(fileInput) fileInput.value = "";
    }
  }, []);

  // --- Event Handlers ---
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    resetState();
    cancelFlag.current = false;
    const selectedFile = e.target.files?.[0] ?? null;

    if (!selectedFile) {
      setFile(null);
      return;
    }
    
    const url = URL.createObjectURL(selectedFile);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width < 30 || img.height < 30) {
        setImageError("Image too small. Please upload an image at least 30x30 pixels.");
        setFile(null);
      } else {
        setFile(selectedFile);
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

  // --- Core OCR Logic ---
  const performOcr = useCallback(async (selectedLang: string) => {
    if (!file || !worker) return;
    
    setLoading(true);
    setFullText("");
    setImageError("");
    setProgress(0);
    setProgressLabel("Loading language model...");
    cancelFlag.current = false;

    try {
      await worker.loadLanguage(selectedLang);
      await worker.initialize(selectedLang);
      const { data } = await worker.recognize(file);
      
      if (cancelFlag.current) {
        resetState();
        setProgressLabel("Operation cancelled.");
        return;
      }

      const cleanText = data.text.trim();
      setFullText(cleanText);
      setProgressLabel(cleanText.length > 3 ? "Analysis Complete" : "No text detected.");
      if (cleanText.length < 3) setImageError("No text detected! Please try a clearer image.");

    } catch (e) {
      if (!cancelFlag.current) {
        setImageError("OCR failed. Check your file, language, or console for details.");
        setProgressLabel("Error during OCR");
      }
    } finally {
      if (!cancelFlag.current) setLoading(false);
      setProgress(100);
    }
  }, [file, worker, resetState]);


  const autoDetectLanguage = useCallback(async () => {
    if (!file || !worker) return;

    setLoading(true);
    setFullText("");
    setImageError("");
    setProgress(0);
    cancelFlag.current = false;
    setProgressLabel("Starting script detection...");

    try {
      // 1. Use OSD to detect the script
      await worker.loadLanguage("osd");
      await worker.initialize("osd");
      const { data: { script } } = await worker.recognize(file);
      setProgressLabel(`Script detected: ${script}. Now testing relevant languages...`);
      
      // 2. Find candidate languages for the detected script
      const candidateLangs = SCRIPT_TO_LANG_MAP[script] || [];
      if (candidateLangs.length === 0) {
        throw new Error(`No candidate languages found for script: ${script}`);
      }
      
      // 3. Test candidate languages to find the best match
      let bestMatch = { lang: null as LangOption | null, confidence: 0, text: "" };

      for (const langCode of candidateLangs) {
        if (cancelFlag.current) break;
        const langOpt = ALL_LANGS.find(l => l.value === langCode);
        if (!langOpt) continue;

        setProgressLabel(`Testing ${langOpt.label}...`);
        await worker.loadLanguage(langCode);
        await worker.initialize(langCode);
        const { data } = await worker.recognize(file);
        
        if (data.confidence > bestMatch.confidence) {
          bestMatch = { lang: langOpt, confidence: data.confidence, text: data.text };
        }
      }

      if (cancelFlag.current) {
          resetState();
          setProgressLabel("Detection cancelled.");
          return;
      }

      // 4. Set the best result
      if (bestMatch.lang && bestMatch.confidence > CONFIDENCE_THRESHOLD) {
        setLang(bestMatch.lang);
        setFullText(bestMatch.text.trim());
        setProgressLabel(`Auto-detected: ${bestMatch.lang.label} (Confidence: ${Math.round(bestMatch.confidence)}%)`);
      } else {
        setImageError("Automatic detection failed. Please choose a language manually.");
        setProgressLabel("Could not auto-detect language with high confidence.");
      }
    } catch (e) {
        if (!cancelFlag.current) {
            setImageError("Script detection failed. Please select a language manually.");
            setProgressLabel("Auto-detection error.");
        }
    } finally {
      if (!cancelFlag.current) setLoading(false);
      setProgress(100);
    }
  }, [file, worker, resetState]);


  // --- JSX Rendering ---
  const isBusy = loading || !worker;

  return (
    <div className="container" aria-live="polite">
      <h1>Searchable Language OCR</h1>
      
      <div className="instructions">
         <p>
          <b>Instructions:</b> Upload a clear image, select a mode, and run the analysis. 
          For best results, use sharp images with good contrast. If automatic detection is inaccurate, switch to manual mode.
        </p>
      </div>

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

      {mode.value === "manual" ? (
        <>
          <div className="lang-select-wrapper">
            <label htmlFor="lang-select">Select OCR Language:</label>
            <Select
                inputId="lang-select"
                options={ALL_LANGS.filter((l) => l.value !== "osd")}
                value={lang}
                onChange={(option) => setLang(option)}
                isDisabled={isBusy}
            />
          </div>
          <div className="actions">
            <button onClick={() => performOcr(lang!.value)} disabled={!file || !lang || isBusy}>
              {loading ? "Analyzing..." : "Analyze Image"}
            </button>
          </div>
        </>
      ) : (
        <div className="actions">
            <button onClick={autoDetectLanguage} disabled={!file || isBusy}>
              {loading ? "Detecting..." : "Detect Language"}
            </button>
        </div>
      )}

      {(loading || imageError) && (
        <div className="actions">
            <button onClick={() => resetState(loading)} className="cancel">
              Cancel
            </button>
        </div>
      )}

       <div className="analysisSection">
        {progressLabel && <div className="progressLabel">{progressLabel}</div>}
        {loading && <progress value={progress} max="100" style={{width: "100%", marginTop: "10px"}} />}
        {imageError && <div className="errorMsg">{imageError}</div>}
        
        {fullText && !loading && (
          <>
            <h3>Extracted Text</h3>
            <div className="extractedText">{fullText}</div>
          </>
        )}
      </div>

      <div className="actions">
        <button onClick={() => resetState(true)} className="clear" disabled={loading}>
          Clear All
        </button>
      </div>
    </div>
  );
}

