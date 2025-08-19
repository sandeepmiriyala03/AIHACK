import React from "react";
import Select, { ActionMeta, MultiValue, SingleValue } from "react-select";

export type LangOption = { value: string; label: string };

interface LangSelectComponentProps {
  lang: LangOption | LangOption[] | null;
  onLangChange: (
    newValue: SingleValue<LangOption> | MultiValue<LangOption>,
    actionMeta: ActionMeta<LangOption>
  ) => void;
  allLangs: LangOption[];
  loading: boolean;
  isMulti?: boolean;
}

export function LangSelectComponent({
  lang,
  onLangChange,
  allLangs,
  loading,
  isMulti = false,
}: LangSelectComponentProps) {
  return (
    <div className="lang-select-wrapper">
      <label htmlFor="lang-select" className="lang-select-label">
        Select OCR Language:
      </label>
      <Select<LangOption, boolean>
        inputId="lang-select"
        options={allLangs}
        value={lang}
        onChange={onLangChange}
        placeholder="Search or scroll to choose language..."
        isClearable={false}
        isDisabled={loading}
        isMulti={isMulti}
      />
    </div>
  );
}
