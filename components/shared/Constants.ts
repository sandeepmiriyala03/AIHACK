// components/shared/Constants.ts

export const SUPPORTED_LANGUAGES = [
  "telugu",
  "sanskrit",
  "hindi",
  "english",
] as const;

export const STORAGE_KEYS = {
  PAGES: "akshara_pages",
  SETTINGS: "akshara_settings",
  LAST_LANGUAGE: "akshara_last_language",
} as const;

export const MAX_UPLOAD_COUNT = 100;
export const MAX_PAGE_PREVIEW = 50;
