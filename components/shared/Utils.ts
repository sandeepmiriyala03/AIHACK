// components/shared/Utils.ts
// Generic helpers used across OCR engine (cleaning, transliteration, download, etc.)

/* ---------------------------------------------------------
   Telugu → Latin Transliteration Map
--------------------------------------------------------- */
const TELUGU_TO_LATIN: Record<string, string> = {
  "అ":"a","ఆ":"aa","ఇ":"i","ఈ":"ii","ఉ":"u","ఊ":"uu","ఋ":"r",
  "ఎ":"e","ఏ":"ee","ఐ":"ai","ఒ":"o","ఓ":"oo","ఔ":"au",
  "క":"ka","ఖ":"kha","గ":"ga","ఘ":"gha","ఙ":"nga",
  "చ":"cha","ఛ":"chha","జ":"ja","ఝ":"jha","ఞ":"nya",
  "ట":"ta","ఠ":"tha","డ":"da","ఢ":"dha","ణ":"na",
  "త":"ta","థ":"tha","ద":"da","ధ":"dha","న":"na",
  "ప":"pa","ఫ":"pha","బ":"ba","భ":"bha","మ":"ma",
  "య":"ya","ర":"ra","ల":"la","వ":"va",
  "శ":"sha","ష":"ssha","స":"sa","హ":"ha","ళ":"la",
  "ా":"a","ి":"i","ీ":"ii","ు":"u","ూ":"uu","ె":"e","ే":"ee",
  "ై":"ai","ొ":"o","ో":"oo","ౌ":"au",
  "్":"", "ం":"m","ః":"h"
};

/* ---------------------------------------------------------
   Transliteration (Telugu → Latin readable)
--------------------------------------------------------- */
export function transliterateTeluguToLatin(input: string): string {
  if (!input) return "";

  const hasAscii = /[A-Za-z0-9]/.test(input);
  if (hasAscii) {
    return input
      .normalize("NFKD")
      .replace(/[^\x00-\x7F]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  let output = "";
  for (const ch of input) {
    if (TELUGU_TO_LATIN[ch]) output += TELUGU_TO_LATIN[ch];
    else if (/\s/.test(ch)) output += " ";
    else if (/[|।.,\-]/.test(ch)) output += " ";
  }

  output = output.replace(/\s+/g, " ").trim();

  return output
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
    .join(" ")
    .trim();
}

/* ---------------------------------------------------------
   Slugify -> camelCase English
--------------------------------------------------------- */
export function toEnglishSlug(input: string): string {
  const translit = transliterateTeluguToLatin(input);
  if (!translit) return `mantra_${Date.now()}`;

  const words = translit
    .replace(/[^A-Za-z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .map((s) => s.toLowerCase())
    .filter(Boolean);

  if (!words.length) return `mantra_${Date.now()}`;

  const camel =
    words[0] +
    words
      .slice(1)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join("");

  if (!/^[A-Za-z]/.test(camel)) return `mantra_${Date.now()}`;
  return camel;
}

/* ---------------------------------------------------------
   Telugu-aware space cleaner (OCR fix)
--------------------------------------------------------- */
export function combineTeluguSpaces(text: string): string {
  if (!text) return "";

  const t = text
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/\u200C/g, " ");

  const chars = Array.from(t);
  const punctuation = new Set(["|", "||", "।", "॥", ".", ",", "!", "?", "\n"]);

  let output = "";
  let pendingSpace = false;

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];

    if (ch === " " || ch === "\u00A0") {
      pendingSpace = true;
      continue;
    }

    if (punctuation.has(ch) || ch === "\n") {
      output += (pendingSpace ? " " : "") + ch;
      pendingSpace = false;
      continue;
    }

    const isTelugu = /[\u0C00-\u0C7F]/.test(ch);
    const last = output.length ? output[output.length - 1] : "";
    const lastIsTelugu = last ? /[\u0C00-\u0C7F]/.test(last) : false;

    if (pendingSpace && isTelugu && lastIsTelugu) {
      output += ch; // remove bad space
    } else {
      output += (pendingSpace ? " " : "") + ch;
    }

    pendingSpace = false;
  }

  const cleaned = output
    .replace(/[ ]+/g, " ")
    .split("\n")
    .map((s) => s.trim())
    .join("\n")
    .trim();

  return cleaned;
}

/* ---------------------------------------------------------
   Chunk array
--------------------------------------------------------- */
export function chunkArray<T>(arr: T[], size = 25): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

/* ---------------------------------------------------------
   Blob downloader
--------------------------------------------------------- */
export function downloadBlob(blob: Blob, filename = "download.bin"): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------------------------------------------------------
   Human-readable file size
--------------------------------------------------------- */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(decimals));
  return `${size} ${["B", "KB", "MB", "GB", "TB"][i]}`;
}

/* ---------------------------------------------------------
   Default export (ESLint Safe)
--------------------------------------------------------- */
const Utils = {
  transliterateTeluguToLatin,
  toEnglishSlug,
  combineTeluguSpaces,
  chunkArray,
  downloadBlob,
  formatBytes,
};

export default Utils;
