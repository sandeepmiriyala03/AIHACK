import React, { useState } from "react";
import Select, { SingleValue } from "react-select";
import Tesseract from "tesseract.js";

type LangOption = { value: string; label: string };

const ALL_LANGS: LangOption[] = [
  { value: "afr", label: "Afrikaans" },
  { value: "amh", label: "Amharic" },
  { value: "ara", label: "Arabic" },
  { value: "asm", label: "Assamese" },
  { value: "aze", label: "Azerbaijani" },
  { value: "bel", label: "Belarusian" },
  { value: "ben", label: "Bengali" },
  { value: "bod", label: "Tibetan" },
  { value: "bos", label: "Bosnian" },
  { value: "bul", label: "Bulgarian" },
  { value: "cat", label: "Catalan" },
  { value: "ceb", label: "Cebuano" },
  { value: "ces", label: "Czech" },
  { value: "chi_sim", label: "Chinese (Simplified)" },
  { value: "chi_tra", label: "Chinese (Traditional)" },
  { value: "chr", label: "Cherokee" },
  { value: "cym", label: "Welsh" },
  { value: "dan", label: "Danish" },
  { value: "deu", label: "German" },
  { value: "dzo", label: "Dzongkha" },
  { value: "ell", label: "Greek" },
  { value: "eng", label: "English" },
  { value: "enm", label: "English (Old)" },
  { value: "epo", label: "Esperanto" },
  { value: "est", label: "Estonian" },
  { value: "eus", label: "Basque" },
  { value: "fas", label: "Persian" },
  { value: "fin", label: "Finnish" },
  { value: "fra", label: "French" },
  { value: "frk", label: "Frankish" },
  { value: "frm", label: "French (Old)" },
  { value: "gle", label: "Irish" },
  { value: "glg", label: "Galician" },
  { value: "grc", label: "Greek (Ancient)" },
  { value: "guj", label: "Gujarati" },
  { value: "hat", label: "Haitian Creole" },
  { value: "heb", label: "Hebrew" },
  { value: "hin", label: "Hindi" },
  { value: "hrv", label: "Croatian" },
  { value: "hun", label: "Hungarian" },
  { value: "iku", label: "Inuktitut" },
  { value: "ind", label: "Indonesian" },
  { value: "isl", label: "Icelandic" },
  { value: "ita", label: "Italian" },
  { value: "ita_old", label: "Italian (Old)" },
  { value: "jav", label: "Javanese" },
  { value: "jpn", label: "Japanese" },
  { value: "kan", label: "Kannada" },
  { value: "kat", label: "Georgian" },
  { value: "kat_old", label: "Georgian (Old)" },
  { value: "kaz", label: "Kazakh" },
  { value: "khm", label: "Khmer" },
  { value: "kir", label: "Kyrgyz" },
  { value: "kor", label: "Korean" },
  { value: "kur", label: "Kurdish" },
  { value: "lao", label: "Lao" },
  { value: "lat", label: "Latin" },
  { value: "lav", label: "Latvian" },
  { value: "lit", label: "Lithuanian" },
  { value: "mal", label: "Malayalam" },
  { value: "mar", label: "Marathi" },
  { value: "mkd", label: "Macedonian" },
  { value: "mlt", label: "Maltese" },
  { value: "msa", label: "Malay" },
  { value: "mya", label: "Burmese" },
  { value: "nep", label: "Nepali" },
  { value: "nld", label: "Dutch" },
  { value: "nor", label: "Norwegian" },
  { value: "ori", label: "Odia" },
  { value: "pan", label: "Punjabi" },
  { value: "pol", label: "Polish" },
  { value: "por", label: "Portuguese" },
  { value: "pus", label: "Pashto" },
  { value: "que", label: "Quechua" },
  { value: "ron", label: "Romanian" },
  { value: "rus", label: "Russian" },
  { value: "san", label: "Sanskrit" },
  { value: "sin", label: "Sinhala" },
  { value: "slk", label: "Slovak" },
  { value: "slv", label: "Slovenian" },
  { value: "snd", label: "Sindhi" },
  { value: "spa", label: "Spanish" },
  { value: "spa_old", label: "Spanish (Old)" },
  { value: "sqi", label: "Albanian" },
  { value: "srp", label: "Serbian" },
  { value: "swa", label: "Swahili" },
  { value: "swe", label: "Swedish" },
  { value: "syr", label: "Syriac" },
  { value: "tam", label: "Tamil" },
  { value: "tel", label: "Telugu" },
  { value: "tgk", label: "Tajik" },
  { value: "tha", label: "Thai" },
  { value: "tir", label: "Tigrinya" },
  { value: "tur", label: "Turkish" },
  { value: "uig", label: "Uyghur" },
  { value: "ukr", label: "Ukrainian" },
  { value: "urd", label: "Urdu" },
  { value: "uzb", label: "Uzbek" },
  { value: "vie", label: "Vietnamese" },
  { value: "yid", label: "Yiddish" },
];

type LoggerMessage = { status: string; progress?: number };

export default function SearchableLangOcr() {
  const [file, setFile] = useState<File | null>(null);
  const [lang, setLang] = useState<LangOption | null>(
    ALL_LANGS.find((l) => l.value === "eng") || null
  );
  const [progress, setProgress] = useState<string>("");
  const [fullText, setFullText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState<string>("");

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFullText("");
    setProgress("");
    setImageError("");
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

  const onAnalyze = async () => {
    if (!file || !lang) return;
    setProgress("Starting OCR...");
    setFullText("");
    setLoading(true);
    setImageError("");
    const url = URL.createObjectURL(file);
    try {
      const { data: { text } } = await Tesseract.recognize(url, lang.value, {
        logger: (m: LoggerMessage) => {
          if (m.status === "recognizing text") {
            setProgress(`OCR: ${Math.round((m.progress ?? 0) * 100)}%`);
          } else {
            setProgress(m.status);
          }
        },
      });
      URL.revokeObjectURL(url);
      const cleanText = text.trim();
      setFullText(cleanText);
      setProgress("Analysis Complete");
      if (!cleanText || cleanText.length < 3) {
        setImageError("No text detected! Please try with a higher-quality image.");
      }
    } catch {
      setProgress("Error during OCR");
      setImageError("OCR failed. Please check the file and language selection.");
    } finally {
      setLoading(false);
    }
  };

  const onClear = () => {
    setFile(null);
    setLang(ALL_LANGS.find((l) => l.value === "eng") || null);
    setFullText("");
    setProgress("");
    setImageError("");
    setLoading(false);
    const input = document.getElementById("file-upload") as HTMLInputElement | null;
    if (input) input.value = "";
  };

  return (
    <div className="container" aria-live="polite">
      <h1 className="title">Searchable Language OCR</h1>
      <div className="instructions">
        <p>
          Upload an image and select the OCR language using the searchable dropdown below, then click <strong>Analyze</strong>.
        </p>
      </div>

      <div className="uploadArea">
        <input
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="fileInput"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="fileInputLabel">
          {file ? file.name : "Choose Image"}
        </label>
      </div>



<div style={{ marginTop: 12, maxWidth: 320 }}>
  <label htmlFor="lang-select" style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
    Select OCR Language:
  </label>
  <Select
    inputId="lang-select"
    options={ALL_LANGS}
    value={lang}
    onChange={onLangChange}
    placeholder="Search or scroll to choose language..."
    isClearable={false}
  />
</div>

      <div style={{ marginTop: 20 }}>
        <button
          onClick={onAnalyze}
          disabled={!file || loading || !lang}
          className={`uploadButton${!file || loading || !lang ? " disabled" : ""}`}
          aria-disabled={!file || loading || !lang}
          style={{ marginRight: 12 }}
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
        <button
          onClick={onClear}
          className="uploadButton"
          style={{ background: "#ccc", color: "#333" }}
          aria-label="Clear form"
          disabled={loading}
        >
          Clear
        </button>
      </div>

      {imageError && (
        <div className="errorMsg" style={{ marginTop: 20 }}>
          {imageError}
        </div>
      )}

      <div className="analysisSection" aria-live="polite" style={{ marginTop: 24 }}>
        {progress && <div className="fileDetails">{progress}</div>}
        {fullText && !loading && (
          <>
            <h3 className="analysisTitle">Extracted Text</h3>
            <div
              style={{
                background: "#fff5ec",
                color: "#333",
                borderRadius: "10px",
                padding: "15px",
                boxShadow: "0 2px 10px #ffdbe688",
                fontSize: "16px",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                maxHeight: "350px",
                overflowY: "auto",
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
