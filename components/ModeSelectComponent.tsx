import React from "react";
import Select, { SingleValue } from "react-select";
import type { ModeOption } from "../types/types";  // Adjust path accordingly

type ModeSelectProps = {
  mode: ModeOption;
  onModeChange: (option: ModeOption | null) => void;
  modeOptions: ModeOption[];
  selectProps?: { inputId?: string; instanceId?: string };
};

export function ModeSelectComponent({
  mode,
  onModeChange,
  modeOptions,
  selectProps,
}: ModeSelectProps) {
  const handleChange = (value: SingleValue<ModeOption>) => {
    onModeChange(value ?? null);
  };

  return (
    <div
      className="mode-select-wrapper"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        maxWidth: 400,
      }}
    >
      <label htmlFor={selectProps?.inputId || "mode-select"}
        style={{ whiteSpace: "nowrap", fontWeight: 600 }}>
        Select OCR Mode:
      </label>
      <div style={{ flexGrow: 1 }}>
        <Select
          value={mode}
          onChange={handleChange}
          options={modeOptions}
          inputId={selectProps?.inputId}
          instanceId={selectProps?.instanceId}
          isClearable={false}
        />
      </div>
    </div>
  );
}
