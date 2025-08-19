import React from "react";

type LangOption = { value: string; label: string };
type ModeOption = { value: "automatic" | "manual"; label: string };

interface ActionsComponentProps {
  mode: ModeOption;
  loading: boolean;
  file: File | null;
  lang: LangOption[] | null;
  onAnalyze: () => void;
  onClear: () => void;
  onCancel: () => void;
}

export function ActionsComponent({
  mode,
  loading,
  file,
  lang,
  onAnalyze,
  onClear,
  onCancel,
}: ActionsComponentProps) {
  if (mode.value === "manual") {
    const disabled = !file || loading || !lang || lang.length === 0;
    return (
      <div className="actions">
        <button
          onClick={onAnalyze}
          disabled={disabled}
          className={`uploadButton${disabled ? " disabled" : ""}`}
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
        {loading && (
          <button onClick={onCancel} className="uploadButton cancel" aria-label="Cancel ongoing OCR or detection">
            Cancel
          </button>
        )}
        <button onClick={onClear} className="uploadButton clear" disabled={loading} aria-label="Clear form">
          Clear
        </button>
      </div>
    );
  }

  return (
    <div className="actions">
      {loading && (
        <button onClick={onCancel} className="uploadButton cancel" aria-label="Cancel ongoing OCR or detection">
          Cancel
        </button>
      )}
      <button onClick={onClear} className="uploadButton clear" disabled={loading} aria-label="Clear form">
        Clear
      </button>
    </div>
  );
}
