import React from "react";
import Select from "react-select";
import type { SingleValue, MultiValue } from "react-select";

export type LangOption = {
  value: string;
  label: string;
};

type LangSelectComponentProps = {
  lang: LangOption[];
  onLangChange: (val: SingleValue<LangOption> | MultiValue<LangOption>) => void;
  allLangs: LangOption[];
  loading: boolean;
  isMulti: boolean;
  selectProps?: { inputId?: string; instanceId?: string };
};

export function LangSelectComponent({
  lang,
  onLangChange,
  allLangs,
  loading,
  isMulti,
  selectProps,
}: LangSelectComponentProps) {
  return (
    <Select
      value={lang}
      onChange={onLangChange}
      options={allLangs}
      isLoading={loading}
      isMulti={isMulti}
      inputId={selectProps?.inputId}
      instanceId={selectProps?.instanceId}
      closeMenuOnSelect={!isMulti}
    />
  );
}
