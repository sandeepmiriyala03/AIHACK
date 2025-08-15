"use client";
import { useState, ChangeEvent } from "react";

interface Analysis {
  chunk_number: number;
  keywords: string[];
  highlights: string[];
  summary: string[];
}

interface Result {
  total_chunks: number;
  analysis: Analysis[];
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]); // Select single file only
      setError("");
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file); // Key "file" must match backend multer config

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 600, margin: "50px auto", fontFamily: "Arial, sans-serif" }}>
      <h1>Upload Document</h1>
      <input type="file" onChange={handleFileChange} disabled={loading} />
      <button onClick={handleUpload} disabled={loading || !file} style={{ marginTop: 12, padding: 10 }}>
        {loading ? "Uploading..." : "Upload"}
      </button>
      {error && <p style={{ color: "red", marginTop: 20 }}>{error}</p>}
      {result && (
        <section style={{ marginTop: 30 }}>
          <h2>Summary</h2>
          {result.analysis.map((chunk, idx) => (
            <div key={idx}>
              {result.analysis.length > 1 && <h4>Chunk {chunk.chunk_number}</h4>}
              <ul>
                {chunk.summary.map((line, idx2) => (
                  <li key={idx2}>{line}</li>
                ))}
              </ul>
              <h4>Keywords</h4>
              <div>{chunk.keywords.join(", ")}</div>
              <h4>Highlights</h4>
              <ul>
                {chunk.highlights.map((hl, idx3) => (
                  <li key={idx3}>{hl}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
