"use client";
import { useState, ChangeEvent, useRef } from "react";
import FileUpload from "@/components/FileUpload";
import FileInfo from "@/components/FileInfo";
import AccordionChunk from "@/components/AccordionChunk";
import "./globals.css";

interface Analysis {
  chunk_number: number;
  keywords: string[];
  highlights: string[];
  summary: string[];
}

interface Result {
  total_chunks: number;
  file_type?: string;
  analysis: Analysis[];
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [elapsedTime, setElapsedTime] = useState<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError("");
      setResult(null);
      setElapsedTime(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError("");
      setResult(null);
      setElapsedTime(null);
    }
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => setDragOver(false);

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    setElapsedTime(null);
    startTimeRef.current = Date.now();

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        setError("Server returned invalid JSON response");
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError(data.error || "Upload failed");
        setLoading(false);
        return;
      }
      setResult(data);

      if (startTimeRef.current) {
        const duration = (Date.now() - startTimeRef.current) / 1000;
        setElapsedTime(duration);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <h1 className="title">Document Upload & Analysis</h1>

      <section className="instructions">
        <p>
          <strong>Upload Limitations:</strong> For best performance, please upload files under{" "}
          <strong>50 MB</strong>. Supported file types: PDF, DOCX, XLSX, PPTX. Other formats may not be processed correctly.
        </p>
        <p>Please ensure documents contain primarily English text. Image quality affects OCR accuracy.</p>
      </section>

      <FileUpload
        file={file}
        loading={loading}
        onFileChange={handleFileChange}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onUpload={handleUpload}
        dragOver={dragOver}
      />

      <FileInfo file={file} />

      {error && <p className="errorMsg">{error}</p>}

      {result && (
        <section className="analysisSection">
          <h2 className="analysisTitle">Analysis Summary</h2>

          {result.file_type && (
            <p className="fileDetails">
              <b>File Type:</b> {result.file_type.toUpperCase()} &nbsp;|&nbsp;{" "}
              <b>Chunks:</b> {result.total_chunks}
            </p>
          )}

          {result.analysis.length === 0 && (
            <p className="noResults">No analysis results returned.</p>
          )}

          {result.analysis.map((chunk) => (
            <AccordionChunk key={chunk.chunk_number} chunk={chunk} />
          ))}

          {loading && elapsedTime !== null && (
            <p className="processingTime">Processing time: {elapsedTime.toFixed(2)} seconds</p>
          )}
        </section>
      )}
    </main>
  );
}
