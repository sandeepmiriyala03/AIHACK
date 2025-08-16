// components/FileUpload.tsx
import { ChangeEvent } from "react";

interface FileUploadProps {
  file: File | null;
  loading: boolean;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onUpload: () => void;
  dragOver: boolean;
}

export default function FileUpload({
  file,
  loading,
  onFileChange,
  onDrop,
  onDragOver,
  onDragLeave,
  onUpload,
  dragOver,
}: FileUploadProps) {
  return (
    <div
      onDrop={(e) => {
        e.preventDefault();
        onDrop(e);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(e);
      }}
      onDragLeave={() => onDragLeave()}
      className={dragOver ? "uploadArea dragOver" : "uploadArea"}
      style={{
        border: `2px dashed ${dragOver ? "#2980b9" : "#bdc3c7"}`,
        borderRadius: 8,
        padding: 20,
        maxWidth: 600,
        margin: "0 auto 20px",
        cursor: "pointer",
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        justifyContent: "center",
        backgroundColor: dragOver ? "#eaf4fc" : "transparent",
        transition: "background-color 0.3s ease, border-color 0.3s ease",
      }}
    >
      <input
        type="file"
        onChange={onFileChange}
        disabled={loading}
        style={{
          border: "1px solid #ccc",
          borderRadius: 4,
          padding: "8px 12px",
          cursor: loading ? "not-allowed" : "pointer",
          flexGrow: 1,
          minWidth: 280,
        }}
      />
      <button
        onClick={onUpload}
        disabled={loading || !file}
        style={{
          backgroundColor: loading || !file ? "#95a5a6" : "#2980b9",
          color: "white",
          border: "none",
          borderRadius: 4,
          padding: "10px 24px",
          cursor: loading || !file ? "not-allowed" : "pointer",
          fontWeight: "600",
          boxShadow: "0 3px 6px rgba(0,0,0,0.1)",
          transition: "background-color 0.3s ease",
        }}
        onMouseEnter={(e) => {
          if (!loading && file) e.currentTarget.style.backgroundColor = "#3498db";
        }}
        onMouseLeave={(e) => {
          if (!loading && file) e.currentTarget.style.backgroundColor = "#2980b9";
        }}
      >
        {loading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
}
