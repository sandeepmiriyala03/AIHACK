"use client";

import { useState } from "react";

// ── Types (match the Python API's step shape) ───────────────
export interface RagItem {
  label: string;
  text?: string;
  words?: number;
  score?: number;
  vector?: number[];
}

export interface RagStep {
  key: string;
  title: string;
  ms: number;
  summary: string;
  meta?: Record<string, string | number | boolean>;
  items?: RagItem[];
  prompt?: string | null;
}

interface Props {
  ingestSteps: RagStep[];
  searchSteps: RagStep[];
  indexing: boolean;
  searching: boolean;
  error?: string;
}

const INDEX_STAGES = [
  { key: "split", title: "Split", hint: "Text → sentences" },
  { key: "chunk", title: "Chunk", hint: "Sentences → chunks" },
  { key: "embed", title: "Embed", hint: "Chunks → vectors" },
  { key: "store", title: "Store", hint: "Vectors → vector DB" },
];

const QUERY_STAGES = [
  { key: "embed_query", title: "Embed question", hint: "Question → vector" },
  { key: "search", title: "Search", hint: "Nearest chunks" },
  { key: "augment", title: "Augment", hint: "Chunks → prompt" },
  { key: "generate", title: "Generate", hint: "Prompt → answer" },
];

export default function RagWorkflow({ ingestSteps, searchSteps, indexing, searching, error }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const allSteps = [...ingestSteps, ...searchSteps];
  const selectedStep = allSteps.find((s) => s.key === selected) ?? null;

  const renderRow = (
    label: string,
    stages: typeof INDEX_STAGES,
    steps: RagStep[],
    running: boolean,
    startNumber: number,
  ) => (
    <div className="rag-row">
      <div className="rag-row-label">{label}</div>
      <div className="rag-chips">
        {stages.map((stage, i) => {
          const done = steps.find((s) => s.key === stage.key);
          const status = done ? "done" : running ? "running" : "idle";
          return (
            <div key={stage.key} className="rag-chip-wrap">
              <button
                type="button"
                className={`rag-chip ${status} ${selected === stage.key ? "selected" : ""}`}
                onClick={() => done && setSelected(selected === stage.key ? null : stage.key)}
                disabled={!done}
                title={stage.hint}
              >
                <span className="rag-num">{startNumber + i}</span>
                <span className="rag-chip-text">
                  <span className="rag-chip-title">{stage.title}</span>
                  <span className="rag-chip-hint">
                    {done ? `${done.summary} · ${done.ms} ms` : status === "running" ? "working…" : stage.hint}
                  </span>
                </span>
              </button>
              {i < stages.length - 1 && <span className="rag-arrow">→</span>}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="rag-wrap">


      <div className="rag-head">
        <h3>🧭 RAG Workflow</h3>
        <span>Click a finished step to see what happened inside it</span>
      </div>

      {error && <div className="rag-error">⚠️ {error}</div>}

      {renderRow("Indexing · once per document", INDEX_STAGES, ingestSteps, indexing, 1)}
      {renderRow("Question · every time you ask", QUERY_STAGES, searchSteps, searching, 5)}

      {selectedStep && (
        <div className="rag-detail">
          <h4>
            {selectedStep.title} — {selectedStep.summary} ({selectedStep.ms} ms)
          </h4>

          {selectedStep.meta && Object.keys(selectedStep.meta).length > 0 && (
            <dl className="rag-meta">
              {Object.entries(selectedStep.meta).map(([k, v]) => (
                <div key={k} className="is-886e55e">
                  <dt>{k}</dt>
                  <dd>{String(v)}</dd>
                </div>
              ))}
            </dl>
          )}

          {selectedStep.prompt && <pre className="rag-prompt">{selectedStep.prompt}</pre>}

          {!!selectedStep.items?.length && (
            <div className="rag-items">
              {selectedStep.items.map((item, i) => (
                <div key={`${item.label}-${i}`} className="rag-item">
                  <span className="rag-tag">{item.label}</span>
                  <div className="rag-item-body">
                    {item.text && <div>{item.text}</div>}
                    {item.words !== undefined && <div className="rag-sub">{item.words} words</div>}
                    {item.vector && (
                      <div className="rag-vec">
                        [{item.vector.join(", ")}, …]
                      </div>
                    )}
                    {item.score !== undefined && (
                      <>
                        <div className="rag-sub">similarity {item.score}</div>
                        <div className="rag-bar">
                          <div style={{ width: `${Math.max(0, Math.min(1, item.score)) * 100}%` }} />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}