import React, { useState, useRef, useCallback } from "react";
import Tesseract from "tesseract.js";
import { FileUploadComponent } from "./FileUploadComponent";
import FileUploadManager from "@/components/FileUploadManager";
import { ActionsComponent } from "./ActionsComponent";
import { ErrorMessageComponent } from "./ErrorMessageComponent";
import { ExtractedTextSectionComponent } from "./ExtractedTextSectionComponent";
import { SanskritOcrExplanation } from "./SanskritOcrExplanation";
import type { LangOption } from "../types/types";

const SANSKRIT_LANG: LangOption = { value: "san", label: "Sanskrit", group: "indic" };

const MAX_OCR_TIME_MS = 30000;
const MIN_IMAGE_WIDTH = 100;

function resizeImageFile(file: File, minWidth: number, maxWidth: number): Promise<Blob | File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let targetWidth = img.width < minWidth ? minWidth : img.width;
      let targetHeight = Math.round((img.height * targetWidth) / img.width);
      if (targetWidth > maxWidth) {
        targetWidth = maxWidth;
        targetHeight = Math.round((img.height * maxWidth) / img.width);
      }
      if (targetWidth === img.width) {
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
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

export default function SanskritOcrPage() {
  // Default active tab is 'document'
  const [activeTab, setActiveTab] = useState<"image" | "document">("document");
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fullText, setFullText] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [progress, setProgress] = useState("");

  const cancelFlag = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      cancelFlag.current = true;
      setLoading(false);
      setImageError("OCR timed out after 30 seconds.");
      setProgress("OCR timed out.");
    }, MAX_OCR_TIME_MS);
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const updateProgress = (msg: string) => setProgress(msg);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError("");
    setFullText("");
    setProgress("");
    cancelFlag.current = false;
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

  const cleanExtractedText = (text: string) => text.replace(/\s+/g, " ").trim();

  const onAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    updateProgress("Preprocessing image...");
    cancelFlag.current = false;
    startTimer();
    try {
      const preprocessedFile = await resizeImageFile(file, MIN_IMAGE_WIDTH, 1200);
      const url = URL.createObjectURL(preprocessedFile as Blob);
      setFileUrl(url);

      const { data } = await Tesseract.recognize(url, SANSKRIT_LANG.value, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            updateProgress(`OCR ${SANSKRIT_LANG.label}: ${(m.progress ?? 0) * 100 | 0}%`);
          }
        },
      });

      if (!cancelFlag.current) {
        const cleaned = cleanExtractedText(data.text || "");
        setFullText(cleaned);
        if (!cleaned) setImageError("No text detected; try a clearer image.");
        updateProgress("OCR Complete");
        URL.revokeObjectURL(url);
        setFileUrl(null);
      }
    } catch {
      if (!cancelFlag.current) {
        setImageError("OCR failed; please try again.");
        updateProgress("");
      }
    } finally {
      setLoading(false);
      resetTimer();
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
    setImageError("");
    setProgress("");
  };

  return (
    <div className="container" aria-live="polite">
      <h1 className="title">यथाक्षरं पठनम्</h1>
      <SanskritOcrExplanation />

      {/* Stylish Tabs */}
      <div className="mb-10 inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
        
        <button
          className={`px-6 py-2 font-semibold cursor-pointer first:rounded-l-lg last:rounded-r-lg transition duration-300 border border-transparent ${
            activeTab === "document"
              ? "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-blue-600"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
          onClick={() => setActiveTab("document")}
          aria-selected={activeTab === "document"}
          role="tab"
          id="tab-document"
          aria-controls="tabpanel-document"
        >
        प्रलेखान्वासः 
        </button>
        <button
          className={`px-6 py-2 font-semibold cursor-pointer first:rounded-l-lg last:rounded-r-lg transition duration-300 border border-transparent ${
            activeTab === "image"
              ? "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-blue-600"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
          onClick={() => setActiveTab("image")}
          aria-selected={activeTab === "image"}
          role="tab"
          id="tab-image"
          aria-controls="tabpanel-image"
        >
          अक्षराङ्कनं वा प्रलेखान्वासः
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "image" && (
        <section role="tabpanel" id="tabpanel-image" aria-labelledby="tab-image" tabIndex={0} className="mt-6">
          <FileUploadComponent file={file} onFileChange={onFileChange} loading={loading} />
        </section>
      )}

      {activeTab === "document" && (
        <section role="tabpanel" id="tabpanel-document" aria-labelledby="tab-document" tabIndex={0} className="mt-6">
          <FileUploadManager />
        </section>
      )}

      {/* Conditionally show Analyze and Clear buttons ONLY on Image tab */}
      {activeTab === "image" && (
        <ActionsComponent
          mode={{ value: "manual", label: "Manual Selection" }}
          loading={loading}
          file={file}
          lang={[SANSKRIT_LANG]}
          onAnalyze={onAnalyze}
          onClear={onClear}
          onCancel={() => {
            cancelFlag.current = true;
            setLoading(false);
            setProgress("Operation cancelled");
            resetTimer();
          }}
        />
      )}

      <ErrorMessageComponent message={imageError} />

      {fileUrl && (
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <img src={fileUrl} alt="Uploaded preview" style={{ maxWidth: "100%", borderRadius: 12 }} />
        </div>
      )}

      <ExtractedTextSectionComponent progress={progress} fullText={fullText} loading={loading} />
    </div>
  );
}
