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

const G = "#10b981";

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
      <style>{`
        .rag-wrap { margin: 24px 0; padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; }
        .rag-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; }
        .rag-head h3 { margin: 0; font-size: 16px; }
        .rag-head span { font-size: 12px; color: #64748b; }
        .rag-row { margin-bottom: 12px; }
        .rag-row-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #64748b; margin-bottom: 6px; }
        .rag-chips { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
        .rag-chip-wrap { display: flex; align-items: center; gap: 6px; }
        .rag-chip { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 10px; border: 1px solid #e2e8f0; background: #f8fafc; cursor: pointer; text-align: left; font: inherit; min-width: 150px; }
        .rag-chip:disabled { cursor: default; }
        .rag-chip.done { border-color: #a7f3d0; background: #ecfdf5; }
        .rag-chip.selected { border-color: ${G}; box-shadow: 0 0 0 2px #a7f3d0; }
        .rag-chip.running { animation: rag-pulse 1.2s ease-in-out infinite; }
        @keyframes rag-pulse { 50% { background: #f1f5f9; border-color: #cbd5e1; } }
        .rag-num { width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; font-size: 12px; font-weight: 700; background: #e2e8f0; color: #475569; flex-shrink: 0; }
        .rag-chip.done .rag-num { background: ${G}; color: #fff; }
        .rag-chip-text { display: flex; flex-direction: column; }
        .rag-chip-title { font-size: 13px; font-weight: 600; color: #0f172a; }
        .rag-chip-hint { font-size: 11px; color: #64748b; }
        .rag-arrow { color: #94a3b8; }
        .rag-detail { margin-top: 12px; padding: 14px; border-radius: 10px; background: #f8fafc; border: 1px solid #e2e8f0; }
        .rag-detail h4 { margin: 0 0 8px; font-size: 14px; }
        .rag-meta { display: grid; grid-template-columns: max-content 1fr; gap: 4px 12px; font-size: 12px; margin-bottom: 10px; }
        .rag-meta dt { color: #64748b; }
        .rag-meta dd { margin: 0; color: #0f172a; word-break: break-all; }
        .rag-items { display: flex; flex-direction: column; gap: 6px; max-height: 320px; overflow-y: auto; }
        .rag-item { display: flex; gap: 8px; padding: 8px 10px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 12.5px; }
        .rag-tag { font-weight: 700; color: ${G}; flex-shrink: 0; min-width: 28px; }
        .rag-item-body { flex: 1; min-width: 0; }
        .rag-sub { font-size: 11px; color: #94a3b8; margin-top: 2px; }
        .rag-vec { font-family: ui-monospace, monospace; font-size: 11.5px; color: #475569; word-break: break-all; }
        .rag-bar { height: 6px; border-radius: 3px; background: #e2e8f0; margin-top: 4px; overflow: hidden; }
        .rag-bar > div { height: 100%; background: ${G}; }
        .rag-prompt { white-space: pre-wrap; font-family: ui-monospace, monospace; font-size: 12px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; max-height: 320px; overflow-y: auto; margin: 0; }
        .rag-error { color: #991b1b; background: #fee2e2; padding: 8px 12px; border-radius: 8px; font-size: 13px; margin-bottom: 10px; }
      `}</style>

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
                <div key={k} style={{ display: "contents" }}>
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