import { useState, useRef, ChangeEvent } from "react";
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
export function useFileUpload() {
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
      setDragOver(false);
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

  return {
    file,
    error,
    result,
    loading,
    dragOver,
    elapsedTime,
    handleFileChange,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleUpload,
  };
}
