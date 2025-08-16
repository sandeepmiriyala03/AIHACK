// components/AccordionChunk.tsx
import { useState } from "react";
import KeywordBadges from "./KeywordBadges";

interface Analysis {
  chunk_number: number;
  keywords: string[];
  highlights: string[];
  summary: string[];
}

export default function AccordionChunk({ chunk }: { chunk: Analysis }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        marginBottom: 18,
        background: "#f9f9f9",
        borderRadius: 8,
        boxShadow: "0 0 6px rgba(0,0,0,0.05)",
      }}
    >
      <div
        onClick={() => setOpen(!open)}
        style={{
          cursor: "pointer",
          padding: 14,
          background: open ? "#ddebf7" : "#ecf0f1",
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          userSelect: "none",
          fontWeight: "600",
          color: "#2c3e50",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Section {chunk.chunk_number}
        <span>{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div style={{ padding: 18 }}>
          <h4>Summary</h4>
          <ul style={{ marginTop: 6 }}>
            {chunk.summary.length > 0 ? (
              chunk.summary.map((line, i) => <li key={i}>{line}</li>)
            ) : (
              <li>No summary available</li>
            )}
          </ul>

          <h4>Keywords</h4>
          {chunk.keywords.length > 0 ? (
            <KeywordBadges keywords={chunk.keywords} />
          ) : (
            <p>No keywords available</p>
          )}

          <h4 style={{ marginTop: 16 }}>Highlights</h4>
          <ul style={{ marginTop: 6 }}>
            {chunk.highlights.length > 0 ? (
              chunk.highlights.map((hl, i) => <li key={i}>{hl}</li>)
            ) : (
              <li>No highlights available</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
