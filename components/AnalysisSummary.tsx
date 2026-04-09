"use client";

import { useEffect, useState } from "react";
import AccordionChunk from "./AccordionChunk";
import SendIcon from "@mui/icons-material/Send";
import ClearIcon from "@mui/icons-material/Clear";

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

export default function AnalysisSummary({
  result,
  loading,
  elapsedTime,
}: Props) {
  const [queryEngine, setQueryEngine] = useState<any>(null);
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<
    { question: string; answer: string }[]
  >([]);

  // ✅ BUILD LOCAL RAG (NO API)
  useEffect(() => {
    const buildRAG = async () => {
      if (!result?.analysis?.length) return;

      try {
        const { Document, VectorStoreIndex, Settings } = await import("llamaindex");
        const { HuggingFaceEmbedding } = await import(
          "llamaindex/embeddings/HuggingFaceEmbedding"
        );

        // 🔥 LOCAL embedding
        Settings.embedModel = new HuggingFaceEmbedding({
          modelType: "Xenova/all-MiniLM-L6-v2",
        });

        const fullText = result.analysis
          .map((c) => c.summary.join(" "))
          .join(" ");

        const docs = [new Document({ text: fullText })];

        const index = await VectorStoreIndex.fromDocuments(docs);

        setQueryEngine(index.asQueryEngine());

        console.log("✅ RAG Ready (Local)");
      } catch (err) {
        console.error("RAG Error:", err);
      }
    };

    buildRAG();
  }, [result]);

  // ✅ ASK QUESTION (STREAMING)
  const askQuestion = async () => {
    if (!queryEngine) {
      setChatHistory((prev) => [
        ...prev,
        { question, answer: "⚠️ AI not ready yet" },
      ]);
      return;
    }

    const q = question.trim();
    if (!q) return;

    let answerText = "";

    setChatHistory((prev) => [
      ...prev,
      { question: q, answer: "Thinking..." },
    ]);

    setQuestion("");

    try {
      const res = await queryEngine.query(q);
      const text = res.toString();

      // 🔥 Streaming effect
      for (let i = 0; i < text.length; i++) {
        answerText += text[i];

        setChatHistory((prev) => {
          const updated = [...prev];
          updated[updated.length - 1].answer = answerText;
          return updated;
        });

        await new Promise((r) => setTimeout(r, 5));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ HIGHLIGHT ANSWER
  const highlightText = (text: string, answer: string) => {
    if (!answer) return text;

    const words = answer.split(" ").slice(0, 5);

    let highlighted = text;

    words.forEach((word) => {
      const regex = new RegExp(`(${word})`, "gi");
      highlighted = highlighted.replace(
        regex,
        `<mark style="background:yellow">$1</mark>`
      );
    });

    return highlighted;
  };

  const fullText = result?.analysis
    ?.map((c) => c.summary.join(" "))
    .join(" ");

  const lastAnswer = chatHistory.at(-1)?.answer || "";

  const clearChat = () => {
    setChatHistory([]);
    setQuestion("");
  };

  return (
    <section className="analysisSection">
      <h2 className="analysisTitle">📊 Analysis Summary</h2>

      {/* File Info */}
      {result?.file_type && (
        <p className="fileDetails">
          <b>File Type:</b> {result.file_type.toUpperCase()} &nbsp;|&nbsp;
          <b>Chunks:</b> {result.total_chunks}
        </p>
      )}

      {/* Analysis */}
      {!result?.analysis?.length ? (
        <p className="noResults">No analysis results returned.</p>
      ) : (
        result.analysis.map((chunk) => (
          <AccordionChunk key={chunk.chunk_number} chunk={chunk} />
        ))
      )}

      {/* 🔥 Highlighted Document */}
      {fullText && (
        <div
          style={{
            marginTop: 20,
            padding: 10,
            background: "#f9f9f9",
          }}
          dangerouslySetInnerHTML={{
            __html: highlightText(fullText, lastAnswer),
          }}
        />
      )}

      {/* 🤖 CHAT */}
      <div style={{ marginTop: 30 }}>
        <h3>🤖 AI Document Chat</h3>

        {chatHistory.map((chat, i) => (
          <div key={i} style={{ marginBottom: 15 }}>
            <div><b>Q:</b> {chat.question}</div>
            <div><b>A:</b> {chat.answer}</div>
          </div>
        ))}

        <div style={{ display: "flex", gap: 10 }}>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && askQuestion()}
            placeholder="Ask about document..."
            style={{
              flex: 1,
              padding: 10,
            }}
          />

          <button onClick={askQuestion}>
            <SendIcon />
          </button>

          <button onClick={clearChat}>
            <ClearIcon />
          </button>
        </div>
      </div>

      {/* Time */}
      {loading && elapsedTime !== null && (
        <p className="processingTime">
          Processing time: {elapsedTime.toFixed(2)} seconds
        </p>
      )}
    </section>
  );
}