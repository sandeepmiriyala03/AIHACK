"use client";

import { useState } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  SelectChangeEvent,
} from "@mui/material";
import LanguageIcon from "@mui/icons-material/Language";

/* ---------- Supported OCR Languages ---------- */
const LANGUAGES: { label: string; code: string }[] = [
  { label: "Telugu", code: "tel" },
  { label: "Sanskrit", code: "san" },
  { label: "Hindi", code: "hin" },
  { label: "English", code: "eng" },
  { label: "Tamil", code: "tam" },
  { label: "Kannada", code: "kan" },
  { label: "Malayalam", code: "mal" },
];

type LanguageSelectorProps = {
  onChange?: (langCode: string) => void;
};

export default function LanguageSelector({ onChange }: LanguageSelectorProps) {
  const [lang, setLang] = useState<string>("tel"); // default Telugu

  const handleChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setLang(value);
    onChange?.(value); // send OCR engine language code
  };

  return (
    <Box display="flex" alignItems="center" gap={2}>
      <LanguageIcon color="primary" />

      <FormControl fullWidth size="small">
        <InputLabel id="language-select-label">
          Select Language
        </InputLabel>

        <Select
          labelId="language-select-label"
          value={lang}
          label="Select Language"
          onChange={handleChange}
        >
          {LANGUAGES.map((l) => (
            <MenuItem key={l.code} value={l.code}>
              {l.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
