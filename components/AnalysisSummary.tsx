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

  // 🔥 BUILD LOCAL AI (NO API)
  useEffect(() => {
    const buildAI = async () => {
      if (!result?.analysis?.length) return;

      try {
        const { pipeline } = await import("@xenova/transformers");

        const embedder = await pipeline(
          "feature-extraction",
          "Xenova/all-MiniLM-L6-v2"
        );

        const fullText = result.analysis
          .map((c) => c.summary.join(" "))
          .join(" ");

        setQueryEngine({
          embedder,
          text: fullText,
        });

        console.log("✅ Local AI Ready");
      } catch (err) {
        console.error(err);
      }
    };

    buildAI();
  }, [result]);

  // 🔥 ASK QUESTION (SEMANTIC SEARCH)
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

    setChatHistory((prev) => [
      ...prev,
      { question: q, answer: "Thinking..." },
    ]);

    setQuestion("");

    try {
      const { embedder, text } = queryEngine;

      const sentences = text.split(". ");

      let bestMatch = "";
      let bestScore = -Infinity;

      const qEmbedding = await embedder(q, {
        pooling: "mean",
        normalize: true,
      });

      for (const sentence of sentences) {
        const sEmbedding = await embedder(sentence, {
          pooling: "mean",
          normalize: true,
        });

        const score = qEmbedding.data.reduce(
          (sum: number, val: number, i: number) =>
            sum + val * sEmbedding.data[i],
          0
        );

        if (score > bestScore) {
          bestScore = score;
          bestMatch = sentence;
        }
      }

      const answer = bestMatch || "❌ No relevant answer found";

      // 🔥 Streaming effect
      let output = "";
      for (let i = 0; i < answer.length; i++) {
        output += answer[i];

        setChatHistory((prev) => {
          const updated = [...prev];
          updated[updated.length - 1].answer = output;
          return updated;
        });

        await new Promise((r) => setTimeout(r, 5));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fullText = result?.analysis
    ?.map((c) => c.summary.join(" "))
    .join(" ");

  const lastAnswer = chatHistory.at(-1)?.answer || "";

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

  const clearChat = () => {
    setChatHistory([]);
    setQuestion("");
  };

  return (
    <section className="analysisSection">
      <h2 className="analysisTitle">📊 Analysis Summary</h2>

      {result?.file_type && (
        <p className="fileDetails">
          <b>File Type:</b> {result.file_type.toUpperCase()} &nbsp;|&nbsp;
          <b>Chunks:</b> {result.total_chunks}
        </p>
      )}

      {!result?.analysis?.length ? (
        <p>No analysis results</p>
      ) : (
        result.analysis.map((chunk) => (
          <AccordionChunk key={chunk.chunk_number} chunk={chunk} />
        ))
      )}

      {/* Highlight */}
      {fullText && (
        <div
          dangerouslySetInnerHTML={{
            __html: highlightText(fullText, lastAnswer),
          }}
        />
      )}

      {/* Chat */}
      <div style={{ marginTop: 30 }}>
        <h3>🤖 AI Document Chat</h3>

        {chatHistory.map((chat, i) => (
          <div key={i}>
            <b>Q:</b> {chat.question}
            <br />
            <b>A:</b> {chat.answer}
          </div>
        ))}

        <div style={{ display: "flex", gap: 10 }}>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && askQuestion()}
          />

          <button onClick={askQuestion}>
            <SendIcon />
          </button>

          <button onClick={clearChat}>
            <ClearIcon />
          </button>
        </div>
      </div>
    </section>
  );
}