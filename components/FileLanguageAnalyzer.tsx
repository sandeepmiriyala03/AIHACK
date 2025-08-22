import React, { useState, useEffect, useRef, useCallback } from "react";
import Tesseract from "tesseract.js";
import { FileUploadComponent } from "./FileUploadComponent";
import { ModeSelectComponent } from "./ModeSelectComponent";
import { LangSelectComponent } from "./LangSelectComponent";
import type { ModeOption, LangOption } from "../types/types";
import { ActionsComponent } from "./ActionsComponent";
import { ErrorMessageComponent } from "./ErrorMessageComponent";
import { ExtractedTextSectionComponent } from "./ExtractedTextSectionComponent";

// Language configuration with groups
const ALL_LANGS: LangOption[] = [
  { value: "ara", label: "Arabic", group: "other" },
  { value: "asm", label: "Assamese", group: "indic" },
  { value: "ben", label: "Bengali", group: "indic" },
  { value: "bod", label: "Bodo", group: "indic" },
  { value: "chi_sim", label: "Chinese (Simplified)", group: "cjk" },
  { value: "chi_tra", label: "Chinese (Traditional)", group: "cjk" },
  { value: "deu", label: "German", group: "latin" },
  { value: "eng", label: "English", group: "latin" },
  { value: "fra", label: "French", group: "latin" },
  { value: "guj", label: "Gujarati", group: "indic" },
  { value: "hin", label: "Hindi", group: "indic" },
  { value: "ita", label: "Italian", group: "latin" },
  { value: "jpn", label: "Japanese", group: "cjk" },
  { value: "kan", label: "Kannada", group: "indic" },
  { value: "kor", label: "Korean", group: "cjk" },
  { value: "mal", label: "Malayalam", group: "indic" },
  { value: "mar", label: "Marathi", group: "indic" },
  { value: "nep", label: "Nepali", group: "indic" },
  { value: "nld", label: "Dutch", group: "latin" },
  { value: "ori", label: "Odia", group: "indic" },
  { value: "osd", label: "Orientation and Script Detection (OSD)", group: "detection" },
  { value: "pan", label: "Punjabi", group: "indic" },
  { value: "por", label: "Portuguese", group: "latin" },
  { value: "rus", label: "Russian", group: "other" },
  { value: "san", label: "Sanskrit", group: "indic" },
  { value: "snd", label: "Sindhi", group: "indic" },
  { value: "spa", label: "Spanish", group: "latin" },
  { value: "swe", label: "Swedish", group: "latin" },
  { value: "tam", label: "Tamil", group: "indic" },
  { value: "tel", label: "Telugu", group: "indic" },
  { value: "tha", label: "Thai", group: "other" },
  { value: "tur", label: "Turkish", group: "latin" },
  { value: "urd", label: "Urdu", group: "other" },
  { value: "vie", label: "Vietnamese", group: "other" },
];

const LANG_GROUPS: LangOption[][] = [
  ALL_LANGS.filter((l) => l.group === "latin"),
  ALL_LANGS.filter((l) => l.group === "indic"),
  ALL_LANGS.filter((l) => l.group === "cjk"),
  ALL_LANGS.filter((l) => l.group === "other"),
];

const CONFIDENCE_THRESHOLD = 85;
const MAX_OCR_TIME_MS = 30000;

const MODE_OPTIONS: ModeOption[] = [
  { value: "automatic", label: "Automatic Detection" },
  { value: "manual", label: "Manual Selection" },
];

function cleanExtractedText(text: string): string {
  return text.replace(/[^a-zA-Z\s.,'"?!-]/g, "").replace(/\s+/g, " ").trim();
}

function getStableFileKey(file: File): string {
  return `${file.name}_${file.size}_${file.lastModified}`;
}

function resizeImageFile(file: File, minWidth: number, maxWidth: number): Promise<Blob | File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let targetWidth = img.width;
      let targetHeight = img.height;
      if (img.width < minWidth) {
        targetWidth = minWidth;
        targetHeight = Math.round((img.height * minWidth) / img.width);
      } else if (img.width > maxWidth) {
        targetWidth = maxWidth;
        targetHeight = Math.round((img.height * maxWidth) / img.width);
      } else {
        resolve(file);
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to resize image"));
        },
        file.type || "image/png",
        0.8
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

export default function SearchableLangOcr() {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [lang, setLang] = useState<LangOption[]>([ALL_LANGS.find((l) => l.value === "eng")!]);
  const [mode, setMode] = useState<ModeOption>(MODE_OPTIONS[0]);
  const [progress, setProgress] = useState("");
  const [fullText, setFullText] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [timer, setTimer] = useState(0);

  const cancelFlag = useRef(false);
  const ocrCache = useRef<Map<string, string>>(new Map());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef("");

  const updateProgress = (msg: string) => {
    progressRef.current = msg;
    setProgress(msg);
  };

  const resetState = useCallback(() => {
    setFullText("");
    setProgress("");
    setImageError("");
    setTimer(0);
    cancelFlag.current = false;
    stopTimer();
  }, []);

  function startTimer() {
    setTimer(0);
    if (timerRef.current) clearInterval(timerRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    timeoutRef.current = setTimeout(() => {
      cancelOcrProcess();
      setImageError("OCR timed out after 30 seconds.");
      updateProgress("OCR timed out.");
    }, MAX_OCR_TIME_MS);
  }

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timerRef.current = null;
    timeoutRef.current = null;
  }

  const cancelOcrProcess = () => {
    cancelFlag.current = true;
    setLoading(false);
    updateProgress("Operation cancelled");
    stopTimer();
  };

  useEffect(() => {
    resetState();
  }, [file, mode, resetState]);

  useEffect(() => {
    if (!file || mode.value !== "automatic") return;
    let active = true;

    (async () => {
      updateProgress("Auto-detecting language...");
      setLoading(true);
      cancelFlag.current = false;

      try {
        const preprocessedFile = await resizeImageFile(file, 300, 800); // reduced maxWidth for speed
        const url = URL.createObjectURL(preprocessedFile as Blob);
        setFileUrl(url);

        // Parallel detection across all languages
        const recognitionPromises = LANG_GROUPS.flat().map(async (langOpt) => {
          if (!active || cancelFlag.current) return null;
          updateProgress(`Trying ${langOpt.label}...`);
          try {
            const result = await Tesseract.recognize(url, langOpt.value, {
              logger: (m) => {
                if (m.status === "recognizing text") {
                  updateProgress(`OCR ${langOpt.label}: ${Math.round((m.progress ?? 0) * 100)}%`);
                }
              },
            });
            const cleaned = cleanExtractedText(result.data.text || "");
            const confidence = result.data.confidence || 0;
            if (confidence >= CONFIDENCE_THRESHOLD && cleaned.length > 3) {
              return { langOpt, cleaned, confidence };
            }
          } catch {
            return null;
          }
          return null;
        });

        const results = await Promise.allSettled(recognitionPromises);

        if (!active || cancelFlag.current) {
          URL.revokeObjectURL(url);
          setFileUrl(null);
          setLoading(false);
          return;
        }

        const successful = results
          .filter((r) => r.status === "fulfilled")
          .map((r) => (r as PromiseFulfilledResult<{ langOpt: LangOption; cleaned: string; confidence: number }>).value)
          .filter((r) => r !== null) as { langOpt: LangOption; cleaned: string; confidence: number }[];

        if (successful.length > 0) {
          const best = successful.reduce((a, b) => (a.confidence > b.confidence ? a : b));
          setLang([best.langOpt]);
          setFullText(best.cleaned);
          updateProgress(`Detected ${best.langOpt.label} (confidence: ${Math.round(best.confidence)})`);
          setImageError("");
        } else {
          updateProgress("No confident detection found. Please select language manually.");
          setImageError("Please select language manually.");
        }

        URL.revokeObjectURL(url);
        setFileUrl(null);
      } catch {
        if (!cancelFlag.current) {
          updateProgress("Error: auto-detect failed");
          setImageError("Script detection failed.");
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      active = false;
      cancelFlag.current = true;
    };
  }, [file, mode]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    resetState();
    const selected = e.target.files?.[0];
    if (!selected) {
      setFile(null);
      setFileUrl(null);
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setImageError("File size should be less than 5MB");
      setFile(null);
      setFileUrl(null);
      return;
    }
    setFile(selected);
    const url = URL.createObjectURL(selected);
    setFileUrl(url);
  };

  const onAnalyze = async () => {
    if (!file || lang.length === 0) return;
    setLoading(true);
    updateProgress("Preprocessing image...");
    cancelFlag.current = false;
    setFullText("");
    startTimer();
    try {
      const preprocessedFile = await resizeImageFile(file, 300, 1200);
      const url = URL.createObjectURL(preprocessedFile as Blob);
      setFileUrl(url);
      let combinedText = "";
      for (const langOpt of lang) {
        if (cancelFlag.current) break;
        const fileKey = getStableFileKey(file) + "_" + langOpt.value;
        let text = ocrCache.current.get(fileKey);
        if (!text) {
          const { data } = await Tesseract.recognize(url, langOpt.value, {
            logger: (m) =>
              m.status === "recognizing text" && updateProgress(`OCR ${langOpt.label}: ${Math.round((m.progress ?? 0) * 100)}%`),
          });
          text = cleanExtractedText(data.text || "");
          ocrCache.current.set(fileKey, text);
        }
        combinedText += text + "\n\n";
      }
      setFullText(combinedText.trim());
      updateProgress("OCR Complete");
      if (!combinedText.trim()) setImageError("No text detected; try clearer image.");
      if (!cancelFlag.current) {
        URL.revokeObjectURL(url);
        setFileUrl(null);
      }
    } catch {
      if (!cancelFlag.current) {
        updateProgress("Error during OCR");
        setImageError("OCR failed; check file and languages.");
      }
    } finally {
      stopTimer();
      setLoading(false);
    }
  };

  const onClear = () => {
    cancelFlag.current = true;
    setFile(null);
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
      setFileUrl(null);
    }
    setLang([ALL_LANGS.find((l) => l.value === "eng")!]);
    resetState();
  };

  const onModeChange = (option: ModeOption | null) => {
    if (option) {
      cancelFlag.current = true;
      setMode(option);
      resetState();
    }
  };

  return (
    <div className="container" aria-live="polite">
      
      <h1 className="title">Searchable Language OCR</h1>
      <p className="subtitle">Upload an image and extract text in multiple languages. Total languages available: {ALL_LANGS.length}</p>
      <ModeSelectComponent
        mode={mode}
        onModeChange={onModeChange}
        modeOptions={MODE_OPTIONS}
        selectProps={{ inputId: "mode-select", instanceId: "mode-select-instance" }}
      />

      <FileUploadComponent file={file} onFileChange={onFileChange} loading={loading} />

      {mode.value === "manual" && (
        <LangSelectComponent
          lang={lang}
          onLangChange={(val) => setLang(Array.isArray(val) ? [...val] : val ? [val] : [])}
          allLangs={ALL_LANGS.filter((l) => l.value !== "osd")}
          loading={loading}
          isMulti={false}
          selectProps={{ inputId: "lang-select", instanceId: "lang-select-instance" }}
        />
      )}

      <ActionsComponent
        mode={mode}
        loading={loading}
        file={file}
        lang={lang}
        onAnalyze={onAnalyze}
        onClear={onClear}
        onCancel={cancelOcrProcess}
      />

      <ErrorMessageComponent message={imageError} />

      {fileUrl && (
        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          <img src={fileUrl} alt="Uploaded preview" style={{ maxWidth: "100%", borderRadius: "12px" }} />
        </div>
      )}

      <ExtractedTextSectionComponent progress={progress} fullText={fullText} loading={loading} />

      {loading && (
        <div style={{ marginTop: 10 }}>
          <p>
            Elapsed time: {timer} second{timer !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
