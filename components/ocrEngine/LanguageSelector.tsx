"use client";

import { useState } from "react";
import { FormControl, InputLabel, Select, MenuItem, Box } from "@mui/material";
import LanguageIcon from "@mui/icons-material/Language";

const LANGUAGES = [
  "Telugu",
  "Sanskrit",
  "Hindi",
  "English",
  "Tamil",
  "Kannada",
  "Malayalam",
];

export default function LanguageSelector({
  onChange,
}: {
  onChange?: (lang: string) => void;
}) {
  const [lang, setLang] = useState("Telugu");

  const handleChange = (value: string) => {
    setLang(value);
    if (onChange) onChange(value);
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
            <MenuItem key={l} value={l}>
              {l}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
