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

      {/* 🔥 ALWAYS SHOW AFTER OCR */}
      {fullText && (
        <div className="is-bc9cee5">
          <h3>🤖 Ask About This Document</h3>

          <input
            type="text"
            placeholder="Ask something..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="is-75402cb"
          />

          <button
            onClick={askQuestion}
            disabled={!question || loading}
            className="is-cecfe74"
          >
            Ask
          </button>

          {answer && (
            <div className="is-8ecca84">
              <strong>Answer:</strong>
              <p>{answer}</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}