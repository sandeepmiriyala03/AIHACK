import React from "react";

interface ExtractedTextSectionComponentProps {
  progress?: string;
  fullText?: string;
  loading: boolean;

  question: string;
  setQuestion: (val: string) => void;
  askQuestion: () => void;
  answer: string;
}

export function ExtractedTextSectionComponent({
  progress,
  fullText,
  loading,
  question,
  setQuestion,
  askQuestion,
  answer,
}: ExtractedTextSectionComponentProps) {
  return (
    <div className="analysisSection" aria-live="polite">

      {/* Progress */}
      {progress && <div className="fileDetails">{progress}</div>}

      {/* OCR Text */}
      {fullText && !loading && (
        <>
          <h3 className="analysisTitle">Extracted Text</h3>
          <div className="extractedText">{fullText}</div>
        </>
      )}

      {/* 🔥 RAG UI (THIS WAS MISSING IN YOUR FILE) */}
      {(fullText || loading || answer) && (
        <div style={{ marginTop: 30 }}>
          <h3>🤖 Ask About This Document</h3>

          <input
            type="text"
            placeholder="Ask something..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "10px",
            }}
          />

          <button
            onClick={askQuestion}
            disabled={!question || loading}
            style={{
              marginTop: "10px",
              padding: "10px 20px",
            }}
          >
            Ask
          </button>

          {answer && (
            <div style={{ marginTop: "15px" }}>
              <strong>Answer:</strong>
              <p>{answer}</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}