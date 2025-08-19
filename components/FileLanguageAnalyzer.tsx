import React, { useState, useEffect, useRef } from "react";
import Tesseract from "tesseract.js";

import { FileUploadComponent } from "./FileUploadComponent";
import { ModeSelectComponent, ModeOption } from "./ModeSelectComponent";
import { LangSelectComponent, LangOption } from "./LangSelectComponent";
import { ActionsComponent } from "./ActionsComponent";
import { ErrorMessageComponent } from "./ErrorMessageComponent";
import { ExtractedTextSectionComponent } from "./ExtractedTextSectionComponent";

type LoggerMessage = {
  status: string;
  progress?: number;
};

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

const LANG_GROUPS: LangOption[][] = [
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
  [
    { value: "chi_sim", label: "Chinese (Simplified)" },
    { value: "chi_tra", label: "Chinese (Traditional)" },
    { value: "jpn", label: "Japanese" },
    { value: "kor", label: "Korean" },
  ],
  [
    { value: "ara", label: "Arabic" },
    { value: "rus", label: "Russian" },
    { value: "tha", label: "Thai" },
    { value: "vie", label: "Vietnamese" },
  ],
];

const CONFIDENCE_THRESHOLD = 85;

const MODE_OPTIONS: ModeOption[] = [
  { value: "automatic", label: "Automatic Detection" },
  { value: "manual", label: "Manual Selection" },
];

function cleanExtractedText(text: string): string {
  return text.replace(/[^a-zA-Z0-9\s.,'"\-?!]/g, "").replace(/\s+/g, " ").trim();
}

export default function SearchableLangOcr() {
  const [file, setFile] = useState<File | null>(null);
  const [lang, setLang] = useState<LangOption[]>([ALL_LANGS.find((l) => l.value === "eng")!]);
  const [mode, setMode] = useState<ModeOption>(MODE_OPTIONS[0]);
  const [progress, setProgress] = useState("");
  const [fullText, setFullText] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState("");
  const cancelFlag = useRef(false);
  const ocrCache = useRef(new Map<string, string>());

  useEffect(() => {
    if (file && mode.value === "automatic") {
      autoDetectLanguageByConfidence(file);
    }
  }, [file, mode]);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    resetState();
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) {
      setFile(null);
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setImageError("File size should be less than 5MB");
      return;
    }
    setFile(selectedFile);
  };

  const resetState = () => {
    setFullText("");
    setProgress("");
    setImageError("");
    cancelFlag.current = false;
    ocrCache.current.clear();
  };

  const autoDetectLanguageByConfidence = async (file: File) => {
    setProgress("Auto-detecting language...");
    cancelFlag.current = false;

    const url = URL.createObjectURL(file);
    let best = { lang: null as LangOption | null, confidence: 0, text: "" };

    try {
      const english = ALL_LANGS.find((l) => l.value === "eng");
      if (english) {
        const { data: engData } = await Tesseract.recognize(url, "eng");
        if (cancelFlag.current) {
          URL.revokeObjectURL(url);
          return;
        }
        const cleanedText = cleanExtractedText(engData.text || "");
        const confidence = engData.confidence ?? 0;

        if (confidence >= CONFIDENCE_THRESHOLD && cleanedText.length > 3) {
          setLang([english]);
          setFullText(cleanedText);
          setProgress(`Detected English (confidence: ${Math.round(confidence)})`);
          URL.revokeObjectURL(url);
          return;
        }
        if (confidence > best.confidence && cleanedText.length > 3) {
          best = { lang: english, confidence, text: cleanedText };
        }
      }

      const groupsToSearch = [LANG_GROUPS[0].filter((l) => l.value !== "eng"), ...LANG_GROUPS.slice(1)];

      outer: for (const group of groupsToSearch) {
        for (const langOpt of group) {
          if (cancelFlag.current) break outer;
          setProgress(`Trying ${langOpt.label}...`);

          const { data } = await Tesseract.recognize(url, langOpt.value);

          if (cancelFlag.current) break outer;

          const cleanedText = cleanExtractedText(data.text || "");
          const confidence = data.confidence ?? 0;

          if (confidence >= CONFIDENCE_THRESHOLD && cleanedText.length > 3) {
            setLang([langOpt]);
            setFullText(cleanedText);
            setProgress(`Detected ${langOpt.label} (confidence: ${Math.round(confidence)})`);
            URL.revokeObjectURL(url);
            return;
          }

          if (confidence > best.confidence && cleanedText.length > 3) {
            best = { lang: langOpt, confidence, text: cleanedText };
          }
        }
      }

      if (best.lang) {
        setLang([best.lang]);
        setFullText(best.text);
        setProgress(`Best available detection: ${best.lang.label} (confidence: ${Math.round(best.confidence)})`);
      } else {
        setProgress("Could not auto-detect language confidently.");
        setImageError("Please select language manually.");
      }
    } catch (e) {
      if (cancelFlag.current) {
        setProgress("Auto-detection cancelled.");
      } else {
        setProgress("Auto-detection error. Please select manually.");
        setImageError("Script detection failed (see console).");
      }
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const onAnalyze = async () => {
    if (!file || lang.length === 0) return;
    setLoading(true);
    setProgress("Starting OCR...");
    cancelFlag.current = false;
    setFullText("");

    const url = URL.createObjectURL(file);
    let combinedText = "";

    try {
      for (const langOpt of lang) {
        if (cancelFlag.current) break;
        const cacheKey = url + "_" + langOpt.value;
        let text = "";
        if (ocrCache.current.has(cacheKey)) {
          text = ocrCache.current.get(cacheKey)!;
        } else {
          const { data } = await Tesseract.recognize(url, langOpt.value, {
            logger: (m: LoggerMessage) => {
              if (cancelFlag.current) return;
              if (m.status === "recognizing text") {
                setProgress(`OCR ${langOpt.label}: ${Math.round((m.progress ?? 0) * 100)}%`);
              }
            },
          });
          text = cleanExtractedText(data.text || "");
          ocrCache.current.set(cacheKey, text);
        }
        combinedText += text + "\n\n";
      }

      setFullText(combinedText.trim());
      setProgress("OCR Complete");
      if (combinedText.trim().length === 0) setImageError("No text detected; try clearer image.");
    } catch (e) {
      if (cancelFlag.current) setProgress("OCR cancelled");
      else {
        setImageError("OCR failed; check file and languages.");
        setProgress("Error during OCR");
      }
    } finally {
      setLoading(false);
      URL.revokeObjectURL(url);
    }
  };

  const cancelOcrProcess = () => {
    cancelFlag.current = true;
    setLoading(false);
    setProgress("Operation cancelled");
  };

  const onClear = () => {
    cancelFlag.current = true;
    setFile(null);
    setLang([ALL_LANGS.find((l) => l.value === "eng")!]);
    resetState();
  };

 

  const onModeChange = (option: ModeOption | null) => {
    if (!option) return;
    cancelFlag.current = true;
    setMode(option);
    resetState();
  };

  return (
    <div className="container" aria-live="polite">
      <h1 className="title">Searchable Language OCR</h1>

      <div className="instructions" role="region" aria-label="instructions">
        <p><strong>Instructions:</strong> Upload a clear image containing text and select automatic or manual mode.</p>
        <p>Automatic mode tries prioritized languages for max speed. Manual mode lets you choose one or more languages.</p>
        <p>Use buttons below to cancel OCR or clear the form.</p>
        <p>Extracted text can be reviewed below.</p>
      </div>

      <ModeSelectComponent mode={mode} onModeChange={onModeChange} modeOptions={MODE_OPTIONS} />

      <FileUploadComponent file={file} onFileChange={onFileChange} loading={loading} />

      {mode.value === "manual" && (
        <LangSelectComponent
          lang={lang}
          onLangChange={(newValue, action) => {
            if (!newValue) {
              setLang([]);
            } else if (Array.isArray(newValue)) {
              setLang([...newValue]); // Spread to convert readonly to mutable array
            } else if ("value" in newValue && "label" in newValue) {
              setLang([newValue]);
            }
          }}
          allLangs={ALL_LANGS.filter((l) => l.value !== "osd")}
          loading={loading}
          isMulti
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
    </div>
  );
}
