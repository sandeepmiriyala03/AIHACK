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
    <div className="is-04b57f5">
      <h3>📤 Upload Images</h3>

      <button
        onClick={() => inputRef.current?.click()}
        className="is-b49fd9b"
      >
        Select Files
      </button>

      <input
        type="file"
        accept="image/*"
        multiple
        ref={inputRef}
        onChange={handleSelectFiles}
        className="is-224b51a"
      />
    </div>
  );
}
