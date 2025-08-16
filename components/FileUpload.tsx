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
      onDragLeave={onDragLeave}
      className={dragOver ? "uploadArea dragOver" : "uploadArea"}
    >
      {/* Hidden native file input */}
      <input
        type="file"
        id="file-upload"
        className="fileInput"
        onChange={onFileChange}
        disabled={loading}
      />
      {/* Custom styled label acting as button */}
      <label
        htmlFor="file-upload"
        className="fileInputLabel"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.currentTarget.click();
          }
        }}
      >
        {file ? "Change File" : "Choose File"}
      </label>

      <button
        className={loading || !file ? "uploadButton disabled" : "uploadButton"}
        onClick={onUpload}
        disabled={loading || !file}
      >
        {loading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
}
