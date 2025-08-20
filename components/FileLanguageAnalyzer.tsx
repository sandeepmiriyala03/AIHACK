import React, { useState, useEffect, useRef } from "react";
import Tesseract from "tesseract.js";
import { FileUploadComponent } from "./FileUploadComponent";
import { ModeSelectComponent } from "./ModeSelectComponent";
import { LangSelectComponent } from "./LangSelectComponent";
import type { ModeOption, LangOption } from "../types/types"; // Adjust path as necessary
import { ActionsComponent } from "./ActionsComponent";
import { ErrorMessageComponent } from "./ErrorMessageComponent";
import { ExtractedTextSectionComponent } from "./ExtractedTextSectionComponent";

const ALL_LANGS: LangOption[] = [
  { value: "ara", label: "Arabic" }, { value: "asm", label: "Assamese" },
  { value: "ben", label: "Bengali" }, { value: "bod", label: "Bodo" },
  { value: "chi_sim", label: "Chinese (Simplified)" }, { value: "chi_tra", label: "Chinese (Traditional)" },
  { value: "deu", label: "German" }, { value: "eng", label: "English" },
  { value: "fra", label: "French" }, { value: "guj", label: "Gujarati" },
  { value: "hin", label: "Hindi" }, { value: "ita", label: "Italian" },
  { value: "jpn", label: "Japanese" }, { value: "kan", label: "Kannada" },
  { value: "kor", label: "Korean" }, { value: "mal", label: "Malayalam" },
  { value: "mar", label: "Marathi" }, { value: "nep", label: "Nepali" },
  { value: "nld", label: "Dutch" }, { value: "ori", label: "Odia" },
  { value: "osd", label: "Orientation and Script Detection (OSD)" }, { value: "pan", label: "Punjabi" },
  { value: "por", label: "Portuguese" }, { value: "rus", label: "Russian" },
  { value: "san", label: "Sanskrit" }, { value: "snd", label: "Sindhi" },
  { value: "spa", label: "Spanish" }, { value: "swe", label: "Swedish" },
  { value: "tam", label: "Tamil" }, { value: "tel", label: "Telugu" },
  { value: "tha", label: "Thai" }, { value: "tur", label: "Turkish" },
  { value: "urd", label: "Urdu" }, { value: "vie", label: "Vietnamese" },
];

const LANG_GROUPS: LangOption[][] = [
  ALL_LANGS.filter(l => ["eng","spa","fra","deu","nld","ita","por","swe","tur"].includes(l.value)),
  ALL_LANGS.filter(l => ["hin","tam","tel","mal","mar","guj","ori","pan","san","asm","ben","nep","snd","bod","kan"].includes(l.value)),
  ALL_LANGS.filter(l => ["chi_sim","chi_tra","jpn","kor"].includes(l.value)),
  ALL_LANGS.filter(l => ["ara","rus","tha","vie"].includes(l.value)),
]; 
const CONFIDENCE_THRESHOLD = 85;
const MAX_OCR_TIME_MS = 30000;

const MODE_OPTIONS: ModeOption[] = [
  { value: "automatic", label: "Automatic Detection" },
  { value: "manual", label: "Manual Selection" },
];

function cleanExtractedText(text: string) {
  return text.replace(/[^a-zA-Z\s.,'"?!-]/g, "").replace(/\s+/g, " ").trim();
}

function resizeImageFile(file: File, minWidth: number, maxWidth: number): Promise<Blob> {
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
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to resize image"));
      }, file.type || "image/png", 0.8);
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
  const [lang, setLang] = useState<LangOption[]>([ALL_LANGS.find(l => l.value === "eng")!]);
  const [mode, setMode] = useState<ModeOption>(MODE_OPTIONS[0]);
  const [progress, setProgress] = useState("");
  const [fullText, setFullText] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [timer, setTimer] = useState(0);

  const cancelFlag = useRef(false);
  const ocrCache = useRef(new Map<string, string>());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetState = () => {
    setFullText("");
    setProgress("");
    setImageError("");
    setTimer(0);
    cancelFlag.current = false;
    ocrCache.current.clear();
    stopTimer();
  };

  useEffect(() => {
    if (file && mode.value === "automatic") {
      autoDetectLanguageByConfidence(file);
    }
    // eslint-disable-next-line
  }, [file, mode]);

  const startTimer = () => {
    setTimer(0);
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    timeoutRef.current = setTimeout(() => {
      cancelOcrProcess();
      setImageError("OCR timed out after 30 seconds.");
      setProgress("OCR timed out.");
    }, MAX_OCR_TIME_MS);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timerRef.current = null;
    timeoutRef.current = null;
    setTimer(0);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    resetState();
    const selected = e.target.files?.[0];
    if (!selected) return setFile(null);
    if (selected.size > 5 * 1024 * 1024) return setImageError("File size should be less than 5MB");
    setFile(selected);
  };

  async function autoDetectLanguageByConfidence(file: File) {
    setProgress("Auto-detecting language...");
    cancelFlag.current = false;
    setLoading(true);
    try {
      const preprocessedFile = await resizeImageFile(file, 300, 1200);
      const url = URL.createObjectURL(preprocessedFile);
      const startTime = performance.now();
      for (const group of LANG_GROUPS) {
        if (cancelFlag.current) {
          URL.revokeObjectURL(url);
          setLoading(false);
          resetState();
          return;
        }
        setProgress(`Trying group: ${group.map(l => l.label).join(", ")}`);
        for (const langOpt of group) {
          if (cancelFlag.current) {
            URL.revokeObjectURL(url);
            setLoading(false);
            resetState();
            return;
          }
          setProgress(`Trying ${langOpt.label}...`);
          const { data } = await Tesseract.recognize(url, langOpt.value);
          const cleaned = cleanExtractedText(data.text || "");
          const confidence = data.confidence || 0;
          if (confidence >= CONFIDENCE_THRESHOLD && cleaned.length > 3) {
            const endTime = performance.now();
            setLang([langOpt]);
            setFullText(cleaned);
            setProgress(`Detected ${langOpt.label} (confidence: ${Math.round(confidence)}), in ${((endTime - startTime) / 1000).toFixed(2)}s`);
            URL.revokeObjectURL(url);
            setLoading(false);
            return;
          }
        }
      }
      setProgress("No confident detection found. Please select language manually.");
      setImageError("Please select language manually.");
      URL.revokeObjectURL(url);
      setLoading(false);
    } catch {
      setProgress(cancelFlag.current ? "Cancelled" : "Error: auto-detect failed");
      setImageError("Script detection failed.");
      setLoading(false);
    }
  }

  const onAnalyze = async () => {
    if (!file || lang.length === 0) return;
    setLoading(true);
    setProgress("Preprocessing image...");
    cancelFlag.current = false;
    setFullText("");
    startTimer();
    try {
      const preprocessedFile = await resizeImageFile(file, 300, 1200);
      const url = URL.createObjectURL(preprocessedFile);
      let combinedText = "";
      for (const langOpt of lang) {
        if (cancelFlag.current) break;
        const cacheKey = url + "_" + langOpt.value;
        let text = ocrCache.current.get(cacheKey) || "";
        if (!text) {
          const { data } = await Tesseract.recognize(url, langOpt.value, {
            logger: (m) => m.status === "recognizing text" && setProgress(`OCR ${langOpt.label}: ${Math.round((m.progress ?? 0) * 100)}%`),
          });
          text = cleanExtractedText(data.text || "");
          ocrCache.current.set(cacheKey, text);
        }
        combinedText += text + "\n\n";
      }
      setFullText(combinedText.trim());
      setProgress(`OCR Complete in ${(performance.now() / 1000).toFixed(2)} seconds`);
      if (!combinedText.trim()) setImageError("No text detected; try clearer image.");
      URL.revokeObjectURL(url);
    } catch {
      setProgress(cancelFlag.current ? "OCR cancelled" : "Error during OCR");
      setImageError("OCR failed; check file and languages.");
    } finally {
      stopTimer();
      setLoading(false);
    }
  };

  const onClear = () => {
    cancelFlag.current = true;
    setFile(null);
    setLang([ALL_LANGS.find(l => l.value === "eng")!]);
    resetState();
  };

  const cancelOcrProcess = () => {
    cancelFlag.current = true;
    setLoading(false);
    setProgress("Operation cancelled");
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
          isMulti={true}
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

      <ExtractedTextSectionComponent progress={progress} fullText={fullText} loading={loading} />

      {loading && <div style={{ marginTop: 10 }}><p>Elapsed time: {timer} second{timer !== 1 ? "s" : ""}</p></div>}
    </div>
  );
}
