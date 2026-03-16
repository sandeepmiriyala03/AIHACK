import React from "react";

interface FileUploadComponentProps {
  file: File | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  loading: boolean;
}

export function FileUploadComponent({ file, onFileChange, loading }: FileUploadComponentProps) {
  return (
    <div className="uploadArea">
      <input
        type="file"
        accept="image/*"
        id="file-upload"
        onChange={onFileChange}
        className="fileInput"
        disabled={loading}
      />
      <label htmlFor="file-upload" className={`fileInputLabel${loading ? " disabled" : ""}`}>
        {file ? file.name : "Choose Image"}
      </label>
    </div>
  );
}
