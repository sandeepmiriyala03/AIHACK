"use client";

import { useEffect, useMemo, useState } from "react";
import AccordionChunk from "./AccordionChunk";
import RagWorkflow, { RagStep, RagItem } from "./RagWorkflow";
import SendIcon from "@mui/icons-material/Send";
import ClearIcon from "@mui/icons-material/Clear";

// Use the local Python server in development and the co-deployed Vercel function in production.
const RAG_API =
  process.env.NEXT_PUBLIC_RAG_API ||
  (process.env.NODE_ENV === "production" ? "/api/main" : "http://localhost:8000");

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

type RagStatus = "idle" | "indexing" | "ready" | "searching" | "error";

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  // Local server (http://...) uses normal paths; Vercel's /api/main needs ?route=
  const url = RAG_API.startsWith("http")
    ? `${RAG_API}${path}`
    : `${RAG_API}?route=${encodeURIComponent(path)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      typeof data?.detail === "string" ? data.detail : `RAG API error ${res.status}`,
    );
  }
  return data as T;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default function AnalysisSummary({ result, loading, elapsedTime }: Props) {
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<{ question: string; answer: string }[]>([]);

  const [docId, setDocId] = useState<string | null>(null);
  const [status, setStatus] = useState<RagStatus>("idle");
  const [ragError, setRagError] = useState("");
  const [ingestSteps, setIngestSteps] = useState<RagStep[]>([]);
  const [searchSteps, setSearchSteps] = useState<RagStep[]>([]);
  const [sources, setSources] = useState<RagItem[]>([]);

  const fullText = useMemo(
    () => result?.analysis?.map((c) => c.summary.join(" ")).join("\n") ?? "",
    [result],
  );

  // ── INDEXING: split → chunk → embed → store (Python API) ──
  useEffect(() => {
    if (!fullText.trim()) return;
    let cancelled = false;

    setStatus("indexing");
    setRagError("");
    setDocId(null);
    setIngestSteps([]);
    setSearchSteps([]);
    setSources([]);

    postJSON<{ doc_id: string; steps: RagStep[] }>("/rag/ingest", { text: fullText })
      .then((data) => {
        if (cancelled) return;
        setDocId(data.doc_id);
        setIngestSteps(data.steps);
        setStatus("ready");
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setStatus("error");
        setRagError(
          err.message === "Failed to fetch"
            ? `Python RAG API is not running at ${RAG_API}`
            : err.message,
        );
      });

    return () => {
      cancelled = true;
    };
  }, [fullText]);

  const setLastAnswer = (answer: string) =>
    setChatHistory((prev) =>
      prev.map((c, i) => (i === prev.length - 1 ? { ...c, answer } : c)),
    );

  // ── QUESTION: embed → search → augment → generate ──
  const askQuestion = async () => {
    const q = question.trim();
    if (!q || status === "searching") return;

    setQuestion("");
    setChatHistory((prev) => [...prev, { question: q, answer: "Thinking..." }]);

    if (!docId) {
      setLastAnswer(
        status === "indexing" ? "⚠️ Still indexing the document, try again in a moment." : `⚠️ ${ragError || "Document is not indexed."}`,
      );
      return;
    }

    setStatus("searching");
    setSearchSteps([]);

    try {
      const data = await postJSON<{ answer: string; sources: RagItem[]; steps: RagStep[] }>(
        "/rag/search",
        { doc_id: docId, text: fullText, question: q, top_k: 3 },
      );
      setSearchSteps(data.steps);
      setSources(data.sources);

      // Typing effect
      const answer = data.answer || "❌ No relevant answer found";
      for (let i = 3; i < answer.length + 3; i += 3) {
        setLastAnswer(answer.slice(0, i));
        await new Promise((r) => setTimeout(r, 10));
      }
      setStatus("ready");
    } catch (err) {
      setLastAnswer(`❌ ${(err as Error).message}`);
      setStatus("ready");
    }
  };

  const clearChat = () => {
    setChatHistory([]);
    setQuestion("");
    setSearchSteps([]);
    setSources([]);
  };

  // Highlight the best-matching chunk inside the full text
  const highlighted = useMemo(() => {
    const safe = escapeHtml(fullText);
    const best = sources[0]?.text;
    if (!best) return safe;
    const words = best
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 8)
      .map((w) => escapeRegExp(escapeHtml(w)));
    if (!words.length) return safe;
    return safe.replace(
      new RegExp(`(${words.join("|")})`, "gi"),
      `<mark style="background:#fef08a">$1</mark>`,
    );
  }, [fullText, sources]);

  return (
    <section className="analysisSection">
      <h2 className="analysisTitle">📊 Analysis Summary</h2>

      {result?.file_type && (
        <p className="fileDetails">
          <b>File Type:</b> {result.file_type.toUpperCase()} &nbsp;|&nbsp;
          <b>Chunks:</b> {result.total_chunks}
          {elapsedTime !== null && <> &nbsp;|&nbsp; <b>Time:</b> {elapsedTime}s</>}
        </p>
      )}

      {!result?.analysis?.length ? (
        <p>{loading ? "Analyzing…" : "No analysis results"}</p>
      ) : (
        result.analysis.map((chunk) => <AccordionChunk key={chunk.chunk_number} chunk={chunk} />)
      )}

      {/* RAG pipeline view */}
      {fullText && (
        <RagWorkflow
          ingestSteps={ingestSteps}
          searchSteps={searchSteps}
          indexing={status === "indexing"}
          searching={status === "searching"}
          error={status === "error" ? ragError : undefined}
        />
      )}

      {/* Full text with the best chunk highlighted */}
      {fullText && (
        <div
          className="is-1ec3f36"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      )}

      {/* Chat */}
      <div className="is-bc9cee5">
        <h3>🤖 Document Q&amp;A</h3>
        <p>Answers quote the most relevant passages. Document text is not stored between requests.</p>

        {chatHistory.map((chat, i) => (
          <div key={i} className="is-3301ea9">
            <b>Q:</b> {chat.question}
            <br />
            <b>A:</b> {chat.answer}
          </div>
        ))}

        <div className="is-0ed0e90">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && askQuestion()}
            placeholder={status === "indexing" ? "Indexing document…" : "Ask about this document"}
            className="is-49cdf87"
          />
          <button onClick={askQuestion} disabled={status === "searching"} aria-label="Ask">
            <SendIcon />
          </button>
          <button onClick={clearChat} aria-label="Clear chat">
            <ClearIcon />
          </button>
        </div>
      </div>
    </section>
  );
}