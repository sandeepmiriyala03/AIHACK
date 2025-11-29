"use client";

import { useState } from "react";
import { FormControl, InputLabel, Select, MenuItem, Box } from "@mui/material";
import LanguageIcon from "@mui/icons-material/Language";

// UI list + OCR engine language code mapping
const LANGUAGES = [
  { label: "Telugu", code: "tel" },
  { label: "Sanskrit", code: "san" },
  { label: "Hindi", code: "hin" },
  { label: "English", code: "eng" },
  { label: "Tamil", code: "tam" },
  { label: "Kannada", code: "kan" },
  { label: "Malayalam", code: "mal" },
];

export default function LanguageSelector({
  onChange,
}: {
  onChange?: (lang: string) => void;
}) {
  const [lang, setLang] = useState("tel"); // default Telugu code

  const handleChange = (value: string) => {
    setLang(value);
    onChange?.(value); // send code (e.g., "san")
  };

  return (
    <Box display="flex" alignItems="center" gap={2}>
      <LanguageIcon color="primary" />
      <FormControl fullWidth>
        <InputLabel>Select Language</InputLabel>
        <Select
          value={lang}
          label="Select Language"
          onChange={(e) => handleChange(e.target.value)}
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
