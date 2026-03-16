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
  const disabled = !file || loading || !lang || lang.length === 0;

  if (mode.value === "manual") {
    return (
      <div className="actions">
        <button
          type="button"
          onClick={onAnalyze}
          disabled={disabled}
          aria-disabled={disabled}
          className={`uploadButton${disabled ? " disabled" : ""}`}
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>

        {loading && (
          <button
            type="button"
            onClick={onCancel}
            className="uploadButton cancel"
            aria-label="Cancel ongoing OCR or detection"
          >
            Cancel
          </button>
        )}

        <button
          type="button"
          onClick={onClear}
          disabled={loading}
          aria-disabled={loading}
          className="uploadButton clear"
          aria-label="Clear form"
        >
          Clear
        </button>
      </div>
    );
  }

  // For automatic mode, only show Cancel (if loading) and Clear buttons
  return (
    <div className="actions">
      {loading && (
        <button
          type="button"
          onClick={onCancel}
          className="uploadButton cancel"
          aria-label="Cancel ongoing OCR or detection"
        >
          Cancel
        </button>
      )}

      <button
        type="button"
        onClick={onClear}
        disabled={loading}
        aria-disabled={loading}
        className="uploadButton clear"
        aria-label="Clear form"
      >
        Clear
      </button>
    </div>
  );
}
