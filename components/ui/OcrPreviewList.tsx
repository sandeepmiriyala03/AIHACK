"use client";

type Props = {
  pages: string[];
  onSelect: (index: number) => void;
  onDelete: (index: number) => void;
};

export default function OcrPreviewList({
  pages,
  onSelect,
  onDelete,
}: Props) {
  return (
    <div style={{ padding: "16px" }}>
      <h3>📄 OCR Pages Preview</h3>

      {pages.length === 0 && <p>No pages extracted yet.</p>}

      {pages.map((page, i) => (
        <div
          key={i}
          style={{
            border: "1px solid #ddd",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "10px",
          }}
        >
          <p style={{ whiteSpace: "pre-wrap" }}>
            {page.substring(0, 100)}...
          </p>

          <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
            <button
              onClick={() => onSelect(i)}
              style={{
                padding: "6px 10px",
                background: "#1976d2",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Edit
            </button>

            <button
              onClick={() => onDelete(i)}
              style={{
                padding: "6px 10px",
                background: "#d32f2f",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
