import React from "react";
import Select from "react-select";

export type ModeOption = {
  value: "automatic" | "manual";
  label: string;
};

interface ModeSelectComponentProps {
  mode: ModeOption;
  onModeChange: (selected: ModeOption | null) => void;
  modeOptions: ModeOption[];
}

export function ModeSelectComponent({ mode, onModeChange, modeOptions }: ModeSelectComponentProps) {
  return (
    <div className="mode-select-wrapper">
      <label htmlFor="mode-select" className="mode-select-label">
        Select Mode:
      </label>
      <Select<ModeOption>
        inputId="mode-select"
        options={modeOptions}
        value={mode}
        onChange={onModeChange}
        isClearable={false}
      />
    </div>
  );
}
