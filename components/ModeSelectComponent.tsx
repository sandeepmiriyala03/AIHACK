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
    <Select
      value={mode}
      onChange={handleChange}
      options={modeOptions}
      inputId={selectProps?.inputId}
      instanceId={selectProps?.instanceId}
      isClearable={false}
    />
  );
}
