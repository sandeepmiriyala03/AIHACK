import { useState } from "react";
import AccordionChunk from "./AccordionChunk";

interface Analysis {
  chunk_number: number;
  keywords: string[];
  highlights: string[];
  summary: string[];
}

interface Result {
  total_chunks: number;
  file_type?: string;
  analysis: Analysis[];
}

interface Props {
  result: Result;
  loading: boolean;
  elapsedTime: number | null;
}

export default function AnalysisSummary({ result, loading, elapsedTime }: Props) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const askQuestion = () => {
    // 🔥 Replace this with your RAG logic later
    setAnswer("Answer will come from AI (connect RAG here)");
  };

  return (
    <section className="analysisSection">
      <h2 className="analysisTitle">Analysis Summary</h2>

      {/* File Details */}
      {result?.file_type && (
        <p className="fileDetails">
          <b>File Type:</b> {result.file_type.toUpperCase()} &nbsp;|&nbsp;
          <b>Chunks:</b> {result.total_chunks}
        </p>
      )}

      {/* Analysis */}
      {!result?.analysis || result.analysis.length === 0 ? (
        <p className="noResults">No analysis results returned.</p>
      ) : (
        result.analysis.map((chunk) => (
          <AccordionChunk key={chunk.chunk_number} chunk={chunk} />
        ))
      )}

      {/* 🔥 ASK QUESTION UI (NEW) */}
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
          disabled={!question}
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

      {/* Processing Time */}
      {loading && elapsedTime !== null && (
        <p className="processingTime">
          Processing time: {elapsedTime.toFixed(2)} seconds
        </p>
      )}
    </section>
  );
}