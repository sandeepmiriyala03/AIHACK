"use client";

import { useRef } from "react";

type Props = {
  onFilesSelected: (files: File[]) => void;
};

export default function OcrUploader({ onFilesSelected }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    onFilesSelected(Array.from(e.target.files));
  };

  return (
    <div style={{ padding: "16px" }}>
      <h3>📤 Upload Images</h3>

      <button
        onClick={() => inputRef.current?.click()}
        style={{
          padding: "10px 18px",
          background: "#1976d2",
          color: "white",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer",
        }}
      >
        Select Files
      </button>

      <input
        type="file"
        accept="image/*"
        multiple
        ref={inputRef}
        onChange={handleSelectFiles}
        style={{ display: "none" }}
      />
    </div>
  );
}
