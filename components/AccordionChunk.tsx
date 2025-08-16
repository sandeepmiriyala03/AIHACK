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
    <div className="accordionChunk">
      <div
        onClick={() => setOpen(!open)}
        className="accordionHeader"
        aria-expanded={open}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(!open);
          }
        }}
      >
        Section {chunk.chunk_number}
        <span>{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div className="accordionContent">
          <h4>Summary</h4>
          <ul className="list">
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
          <ul className="list">
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
