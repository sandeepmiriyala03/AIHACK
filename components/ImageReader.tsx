"use client";

import React, { useState } from "react";
import Tesseract, { LoggerMessage } from "tesseract.js";
import Image from "next/image";

interface LangOption {
  value: string;
  label: string;
  group: string;
}

const ALL_LANGS: LangOption[] = [
  { value: "manual", label: "Manual Script (Handwritten)", group: "manual" },
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

const LANG_GROUPS = [
  { key: "manual", label: "Manual/Handwritten" },
  { key: "latin", label: "Latin" },
  { key: "indic", label: "Indic" },
  { key: "cjk", label: "CJK" },
  { key: "other", label: "Other" },
  { key: "detection", label: "Detection" },
];

export default function ImageOcr() {
  const [imagePath, setImagePath] = useState("");
  const [text, setText] = useState("");
  const [progress, setProgress] = useState(0);
  const [selectedLang, setSelectedLang] = useState("eng");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  // Handle user uploading an image file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImagePath(URL.createObjectURL(e.target.files[0]));
      setText("");
      setProgress(0);
      setError("");
    }
  };

  // Handle OCR language selection change
  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLang(e.target.value);
  };

  // Clear all fields
  const handleClear = () => {
    setImagePath("");
    setText("");
    setProgress(0);
    setError("");
    setIsProcessing(false);
  };

  // Run OCR on uploaded image using Tesseract.js
  const handleReadImage = async () => {
    if (!imagePath) {
      setError("Please upload an image first.");
      return;
    }

    setIsProcessing(true);
    setText("");
    setProgress(0);
    setError("");

    try {
      const options =
        selectedLang === "manual"
          ? {
              lang: "eng",
              tessedit_char_whitelist: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
              logger: (m: LoggerMessage) => {
                if (
                  m.status === "recognizing text" ||
                  m.status === "initializing tesseract" ||
                  m.status === "loading language traineddata"
                ) {
                  setProgress(m.progress);
                }
              },
            }
          : {
              logger: (m: LoggerMessage) => {
                if (
                  m.status === "recognizing text" ||
                  m.status === "initializing tesseract" ||
                  m.status === "loading language traineddata"
                ) {
                  setProgress(m.progress);
                }
              },
            };

      const result = await Tesseract.recognize(
        imagePath,
        selectedLang === "manual" ? "eng" : selectedLang,
        options
      );

      setText(result.data.text.trim());
      setProgress(1);
    } catch (err) {
      console.error(err);
      setError("Error processing the image.");
      setProgress(0);
    }

    setIsProcessing(false);
  };

  return (
    <div style={{ maxWidth: 800, margin: "auto", fontFamily: "sans-serif", padding: 20 }}>
      <h1>Image OCR Reader</h1>
      <p>
        Upload an image and select the language to extract text. For handwritten/manual scripts, select &quot;Manual Script&quot;.
      </p>

      <div style={{ marginBottom: 20, display: "flex", gap: 15, alignItems: "center" }}>
        <label htmlFor="lang-select">Select Language:</label>
        <select
          id="lang-select"
          value={selectedLang}
          onChange={handleLangChange}
          disabled={isProcessing}
          style={{ padding: 8, borderRadius: 4 }}
        >
          {LANG_GROUPS.map((group) => (
            <optgroup key={group.key} label={group.label}>
              {ALL_LANGS.filter((lang) => lang.group === group.key).map((lang) => (
                <option
                  key={lang.value}
                  value={lang.value}
                  title={lang.value === "manual" ? "Use for handwritten/manual scripts (best effort)" : ""}
                >
                  {lang.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 20 }}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isProcessing}
          aria-label="Upload image"
        />
        <button
          onClick={handleReadImage}
          disabled={!imagePath || isProcessing}
          style={{
            marginLeft: 10,
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: 5,
            cursor: isProcessing ? "not-allowed" : "pointer",
            opacity: isProcessing ? 0.6 : 1,
          }}
        >
          {isProcessing ? `Processing ${Math.round(progress * 100)}%` : "Extract Text"}
        </button>
        <button
          onClick={handleClear}
          disabled={isProcessing}
          style={{
            marginLeft: 10,
            padding: "10px 20px",
            backgroundColor: "#6c757d",
            color: "#fff",
            border: "none",
            borderRadius: 5,
            cursor: isProcessing ? "not-allowed" : "pointer",
            opacity: isProcessing ? 0.6 : 1,
          }}
        >
          Clear
        </button>
      </div>

      {progress > 0 && progress < 1 && (
        <div>
          <progress value={progress} max={1} style={{ width: "100%" }} />
          <p>Processing image, please wait...</p>
        </div>
      )}

      {error && (
        <div style={{ color: "red", marginBottom: 10 }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {imagePath && (
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <h2>Uploaded Image Preview</h2>
          <Image
            src={imagePath}
            alt="Uploaded"
            width={600}
            height={400}
            style={{ maxWidth: "100%", borderRadius: 5, border: "1px solid #ccc", height: "auto" }}
          />
        </div>
      )}

      {text && (
        <div
          style={{
            marginTop: 20,
            backgroundColor: "#f4f4f4",
            padding: 20,
            borderRadius: 5,
            border: "1px solid #ddd",
            whiteSpace: "pre-wrap",
            lineHeight: 1.6,
          }}
        >
          <h2>Extracted Text</h2>
          <pre>{text}</pre>
        </div>
      )}
    </div>
  );
}