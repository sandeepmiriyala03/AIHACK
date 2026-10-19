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
      className="mode-select-wrapper is-5843fe1"

    >
      <label htmlFor={selectProps?.inputId || "mode-select"}
        className="is-27e8d1b">
        Select OCR Mode:
      </label>
      <div className="is-a7667d4">
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
