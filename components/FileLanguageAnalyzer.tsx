import React, { useState, useEffect, useRef, useCallback } from "react";
import Tesseract from "tesseract.js";
import { FileUploadComponent } from "./FileUploadComponent";
import { ModeSelectComponent } from "./ModeSelectComponent";
import { LangSelectComponent } from "./LangSelectComponent";
import type { ModeOption, LangOption } from "../types/types";
import { ActionsComponent } from "./ActionsComponent";
import { ErrorMessageComponent } from "./ErrorMessageComponent";
import { ExtractedTextSectionComponent } from "./ExtractedTextSectionComponent";
import Image from "next/image";
let ort: any;


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
const CONFIDENCE_THRESHOLD = 60;
const MAX_OCR_TIME_MS = 30000;
const MIN_IMAGE_WIDTH = 100;
const MODE_OPTIONS: ModeOption[] = [
  { value: "automatic", label: "Automatic Detection" },
  { value: "manual", label: "Manual Selection" },
];

/** Clean and normalize extracted OCR text */
function cleanExtractedText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Generate a stable key for caching OCR results based on the file */
function getStableFileKey(file: File): string {
  return `${file.name}_${file.size}_${file.lastModified}`;
}

/**
 * Resize an image file client-side to be within min/max width bounds.
 * Uses HTML5 Canvas and Image - browser-only APIs.
 * To avoid SSR issues, call this only on client.
 */
function resizeImageFile(
  file: File,
  minWidth: number,
  maxWidth: number
): Promise<Blob | File> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      resolve(file);
      return;
    }

    const img = new window.Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let targetWidth = img.width;
      let targetHeight = img.height;

      if (img.width < minWidth) {
        targetWidth = minWidth;
        targetHeight = Math.round((img.height * minWidth) / img.width);
      } 
      else if (img.width > maxWidth) {
        targetWidth = maxWidth;
        targetHeight = Math.round((img.height * maxWidth) / img.width);
      } 
      else {
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
/** Main React component */
export default function SearchableLangOcr() {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [lang, setLang] = useState<LangOption[]>([
    ALL_LANGS.find((l) => l.value === "eng")!,
  ]);
  const [mode, setMode] = useState<ModeOption>(MODE_OPTIONS[0]);
  const [progress, setProgress] = useState("");
  const [fullText, setFullText] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [timer, setTimer] = useState(0);

  const [ocrEngine, setOcrEngine] = useState<string>("");
  const cancelFlag = useRef(false);
  const ocrCache = useRef<Map<string, string>>(new Map());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef("");

  /** Update OCR progress text */

  
  const updateProgress = (msg: string) => {
    progressRef.current = msg;
    setProgress(msg);
  };

  /** Reset component state */
  const resetState = useCallback(() => {
    setFullText("");
    setProgress("");
    setImageError("");
    setTimer(0);
    cancelFlag.current = false;
    stopTimer();
  }, []);

  /** Start OCR timer and abort after timeout */
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

  /** Stop OCR timer */
  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timerRef.current = null;
    timeoutRef.current = null;
  }

  /** Cancel OCR processing */
  const cancelOcrProcess = () => {
    cancelFlag.current = true;
    setLoading(false);
    updateProgress("Operation cancelled");
    stopTimer();
  };

  /** Reset language if manual mode and no language selected */
  useEffect(() => {
    resetState();
    if (mode.value === "manual" && lang.length === 0) {
      setLang([ALL_LANGS.find((l) => l.value === "eng")!]);
    }
  }, [file, mode, lang.length, resetState]);

/** Auto language detection on file change in automatic mode */
useEffect(() => {

  if (!file || mode.value !== "automatic") return;

  let active = true;

  (async () => {

    updateProgress("Detecting script...");
    setLoading(true);
    cancelFlag.current = false;

    try {

      const preprocessedFile = await resizeImageFile(file, MIN_IMAGE_WIDTH, 800);
      const url = URL.createObjectURL(preprocessedFile as Blob);

      setFileUrl(url);

      /** STEP 1 — Script detection */

      const osd = await Tesseract.recognize(url, "osd");
      const script = (osd.data as any)?.script ?? "";

      updateProgress(`Detected script: ${script}`);

      /** STEP 2 — Select candidate languages */

      let candidateLangs: LangOption[] = [];

      if (
        script.includes("Telugu") ||
        script.includes("Devanagari") ||
        script.includes("Bengali") ||
        script.includes("Tamil") ||
        script.includes("Kannada") ||
        script.includes("Malayalam")
      ) {

        candidateLangs = [
          ALL_LANGS.find(l => l.value === "tel")!,
          ALL_LANGS.find(l => l.value === "hin")!,
          ALL_LANGS.find(l => l.value === "tam")!,
          ALL_LANGS.find(l => l.value === "kan")!,
          ALL_LANGS.find(l => l.value === "mal")!,
        ];

      }
      else if (script.includes("Latin")) {

        candidateLangs = [
          ALL_LANGS.find(l => l.value === "eng")!,
          ALL_LANGS.find(l => l.value === "spa")!,
          ALL_LANGS.find(l => l.value === "fra")!,
        ];

      }
      else {

        candidateLangs = [
          ALL_LANGS.find(l => l.value === "eng")!,
          ALL_LANGS.find(l => l.value === "tel")!,
        ];

      }

      updateProgress(`Testing ${candidateLangs.length} languages...`);

      /** STEP 3 — OCR test */

      let bestMatch: {
        langOpt: LangOption;
        cleaned: string;
        confidence: number;
      } | null = null;

      for (const langOpt of candidateLangs) {

        if (!active || cancelFlag.current) break;

        try {

          const result = await Tesseract.recognize(url, langOpt.value);

          const cleaned = cleanExtractedText(result.data.text || "");
          const confidence = result.data.confidence || 0;

          if (confidence >= CONFIDENCE_THRESHOLD && cleaned.length > 3) {

            if (!bestMatch || confidence > bestMatch.confidence) {
              bestMatch = {
                langOpt,
                cleaned,
                confidence,
              };
            }

          }

        } catch {
          continue;
        }

      }

      /** STEP 4 — Apply best result */

      if (bestMatch) {

        setLang([bestMatch.langOpt]);
        setFullText(bestMatch.cleaned);

        setOcrEngine(`Tesseract Auto (${bestMatch.langOpt.label})`);

        updateProgress(
          `Detected ${bestMatch.langOpt.label} (${Math.round(bestMatch.confidence)}%)`
        );

        setImageError("");

      } else {

        updateProgress("No confident detection found.");
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

  /** Handle user file selection */
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    resetState();
    const selected = e.target.files?.[0];
    if (!selected) {
      setFile(null);
      setFileUrl(null);
      return;
    }
    setFile(selected);
    const url = URL.createObjectURL(selected);
    setFileUrl(url);
  };

  /** Perform OCR analysis on the selected file and language(s) */
const onAnalyze = async () => {

  if (!file || lang.length === 0) return;

  setLoading(true);
  updateProgress("Preprocessing image...");
  cancelFlag.current = false;
  setFullText("");

  startTimer();

  try {

    const preprocessedFile = await resizeImageFile(file, MIN_IMAGE_WIDTH, 1200);

    const url = URL.createObjectURL(preprocessedFile as Blob);

    setFileUrl(url);

    let combinedText = "";

    const selectedLangs = mode.value === "manual" ? [lang[0]] : lang;

    for (const langOpt of selectedLangs) {

      if (cancelFlag.current) break;

      const fileKey = getStableFileKey(file) + "_" + langOpt.value;

      let text = ocrCache.current.get(fileKey);

      if (!text) {

        let confidence = 0;

        try {

          const { data } = await Tesseract.recognize(url, langOpt.value, {
            logger: (m) =>
              m.status === "recognizing text" &&
              updateProgress(
                `Tesseract ${langOpt.label}: ${Math.round((m.progress ?? 0) * 100)}%`
              ),
          });

          text = cleanExtractedText(data.text || "");
          confidence = data.confidence || 0;

          // fallback condition
          if (confidence < 60 || text.length < 5) {
            throw new Error("Low confidence");
          }

       updateProgress(`OCR Engine: Tesseract (${langOpt.label})`);
setOcrEngine(`Tesseract (${langOpt.label})`);
         

        } catch {

          updateProgress(`Tesseract failed → Running PaddleOCR (${langOpt.label})`);

          try {

            text = await runPaddleOCR(url);

            updateProgress(`OCR Engine: PaddleOCR (${langOpt.label})`);
setOcrEngine(`PaddleOCR Fallback (${langOpt.label})`);
          } catch {

            text = "";

            updateProgress("PaddleOCR failed");

          }

        }

        ocrCache.current.set(fileKey, text || "");
      }

      combinedText += (text || "") + "\n\n";
    }

    setFullText(combinedText.trim());

    updateProgress("OCR Complete");

    if (!combinedText.trim())
      setImageError("No text detected; try clearer image.");

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

  setFullText("");
  setProgress("");
  setImageError("");
  setTimer(0);

  stopTimer();
};

  /** Change OCR mode */
  const onModeChange = (option: ModeOption | null) => {
    if (option) {
      cancelFlag.current = true;
      setMode(option);
      resetState();
    }
  };
let paddleSession: any = null;
let ort: any = null;

async function runPaddleOCR(imageUrl: string): Promise<string> {

  if (typeof window === "undefined") return "";

  try {

    if (!ort) {
      ort = await import("onnxruntime-web");
    }

    if (!paddleSession) {
      paddleSession = await ort.InferenceSession.create(
        "/models/paddle/rec.onnx",
        { executionProviders: ["wasm"] }
      );
    }

  const img = new window.Image();
    img.src = imageUrl;

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return "";

    canvas.width = 320;
    canvas.height = 48;

    ctx.drawImage(img, 0, 0, 320, 48);

    const imgData = ctx.getImageData(0, 0, 320, 48);

    const floatData = new Float32Array(3 * 48 * 320);

    for (let i = 0; i < imgData.data.length / 4; i++) {
      floatData[i] = imgData.data[i * 4] / 255;
      floatData[i + 320 * 48] = imgData.data[i * 4 + 1] / 255;
      floatData[i + 2 * 320 * 48] = imgData.data[i * 4 + 2] / 255;
    }

    const tensor = new ort.Tensor("float32", floatData, [1, 3, 48, 320]);

    const feeds = { input: tensor };

    const result = await paddleSession.run(feeds);

    const output = Object.values(result)[0] as any;

    const data = output.data as Float32Array;

    return Array.from(data.slice(0, 20))
      .map(v => Math.round(v))
      .join(" ");

  } catch (error) {

    console.error("PaddleOCR error:", error);
    return "";

  }
}
return (
  <div className="container" aria-live="polite">
    <h1 className="title">Searchable Language OCR</h1>

    <ModeSelectComponent
      mode={mode}
      onModeChange={onModeChange}
      modeOptions={MODE_OPTIONS}
    />

    <FileUploadComponent
      file={file}
      onFileChange={onFileChange}
      loading={loading}
    />

    {mode.value === "manual" && (
      <LangSelectComponent
        lang={lang}
        onLangChange={(val) =>
          setLang(Array.isArray(val) ? [...val] : val ? [val] : [])
        }
        allLangs={ALL_LANGS.filter((l) => l.value !== "osd")}
        loading={loading}
        isMulti={false}
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
      <Image
        src={fileUrl}
        alt="Uploaded preview"
        width={800}
        height={600}
        style={{ width: "100%", height: "auto" }}
      />
    )}

    <ExtractedTextSectionComponent
      progress={progress}
      fullText={fullText}
      loading={loading}
    />

    {ocrEngine && (
      <div style={{ marginTop: 10 }}>
        <strong>OCR Engine Used:</strong> {ocrEngine}
      </div>
    )}

    {loading && (
      <p>
        Elapsed time: {timer} second{timer !== 1 ? "s" : ""}
      </p>
    )}
  </div>
);
}