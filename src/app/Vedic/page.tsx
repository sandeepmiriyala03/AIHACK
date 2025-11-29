'use client';

import { useEffect, useRef, useState } from "react";
import Tesseract from "tesseract.js";

import Navbar from "@/components/Navbar";
import Instructions from "@/components/Instructions";
import FileUploadManager from "@/components/FileUploadManager";
import GoToTopButton from "@/components/GoToTopButton";
import "@/Styles/globals.css";
import "@/Styles/Navbar.css";

/* ============================
   Types
   ============================ */
export type Syllable = {
  char: string;
  pitch?: "high" | "low";
};

export type AchamanamInstruction = {
  mantra: string | Syllable[][];
  action?: string;
  audioUrl?: string;
  recitation?: string;
  explanation?: string;
};

export type RitualData = {
  title: string;
  description?: string;
  preliminaryVerses?: any[];
  videoUrl?: string;
  explanation?: string;
  instructions?: AchamanamInstruction[];
  imageUrl?: string;
};

/* ============================
   Minimal transliteration map
   (practical: covers common Telugu letters used in your dataset)
   Expand mapping later if you need more fidelity.
   ============================ */
const TELUGU_TO_LATIN: Record<string, string> = {
  "అ":"a","ఆ":"aa","ఇ":"i","ఈ":"ii","ఉ":"u","ఊ":"uu","ఋ":"r",
  "ఎ":"e","ఏ":"ee","ఐ":"ai","ఒ":"o","ఓ":"oo","ఔ":"au",
  "క":"ka","ఖ":"kha","గ":"ga","ఘ":"gha","ఙ":"nga",
  "చ":"cha","ఛ":"chha","జ":"ja","ఝ":"jha","ఞ":"nya",
  "ట":"ta","ఠ":"tha","డ":"da","ఢ":"dha","ణ":"na",
  "త":"ta","థ":"tha","ద":"da","ధ":"dha","న":"na",
  "ప":"pa","ఫ":"pha","బ":"ba","భ":"bha","మ":"ma",
  "య":"ya","ర":"ra","ల":"la","వ":"va","శ":"sha","ష":"ssha","స":"sa","హ":"ha","ళ":"la",
  "ః":"h","ౘ":"qa","ఁ":"n","ంః":"mh",
  "ా":"a","ి":"i","ీ":"ii","ు":"u","ూ":"uu",
  "ె":"e","ే":"ee","ై":"ai","ొ":"o","ో":"oo","ౌ":"au","్":"", "ँ":"n",
  "ం":"m","ః":"h", "ఋ":"r"
};

/* Helper: transliterate short (works best for short titles and descriptions) */
function transliterateTeluguToLatin(input: string) {
  // If text already contains ASCII letters, return roughly normalized ASCII text
  const hasAscii = /[A-Za-z0-9]/.test(input);
  if (hasAscii) {
    // simple normalize: remove extra whitespace and diacritics
    return input.normalize('NFKD').replace(/[^\x00-\x7F]/g, '').replace(/\s+/g, ' ').trim();
  }

  let out = '';
  for (const ch of input) {
    if (TELUGU_TO_LATIN[ch]) out += TELUGU_TO_LATIN[ch];
    else if (/\s/.test(ch)) out += ' ';
    else if (/[|।\u0964\u0965\.\,\-]/.test(ch)) out += ' ';
    else {
      // unknown char - drop or use unicode hex as fallback
      // to avoid non-ASCII in slug, use a small placeholder
      // but for readable transliteration we drop
    }
  }
  // Clean repeated spaces and trim
  out = out.replace(/\s+/g, ' ').trim();
  // Title-case probable words for readable description output
  return out.split(' ').map(w => w ? (w.charAt(0).toUpperCase() + w.slice(1)) : '').join(' ').trim();
}

/* Helper: slugify (camelCase) from transliterated text or fallback */
function toEnglishSlug(input: string) {
  const translit = transliterateTeluguToLatin(input) || '';
  if (!translit) {
    return `mantra_${Date.now()}`;
  }
  // remove non letters/numbers, split words, create camelCase
  const words = translit
    .replace(/[^A-Za-z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .map(s => s.toLowerCase())
    .filter(Boolean);
  if (words.length === 0) return `mantra_${Date.now()}`;
  const camel = words[0] + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  // ensure starts with letter
  if (!/^[A-Za-z]/.test(camel)) return `mantra_${Date.now()}`;
  return camel;
}

/* Combine / clean OCR spaces for Telugu: removes obvious OCR-inserted spaces between letters,
   but preserves punctuation and explicit separators (|, ||, ।, ., newline). */
function combineTeluguSpaces(text: string) {
  // quick approach:
  // 1. normalize whitespace
  let t = text.replace(/\r/g, '').replace(/\t/g, ' ').replace(/\u200C/g, ' ');
  // 2. split into tokens by spaces, but if tokens are short (1 grapheme) and all are Telugu, join them
  const seg = new Intl.Segmenter('te', { granularity: 'grapheme' });
  const chars = Array.from(seg.segment(t)).map(s => s.segment);
  // Build result by joining contiguous runs unless punctuation encountered
  const punctuation = new Set(['|', '||', '।', '॥', '.', ',', '!', '?', '\n']);
  let out = '';
  let buffer: string[] = [];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === ' ' || ch === '\u00A0') {
      // treat as separator - we will decide later whether to preserve
      buffer.push(' '); // mark
      continue;
    }
    // if punctuation or newline -> flush
    if (punctuation.has(ch) || ch === '\n') {
      // flush buffer
      out += buffer.join('');
      buffer = [];
      out += ch;
      continue;
    }
    // If previous buffer contains spaces only and this char and previous char are Telugu letters, remove space
    // To decide, peek last real output char (not space)
    const lastChar = out.length ? out[out.length - 1] : '';
    if (buffer.length > 0) {
      // previous had a space
      // if lastChar is Telugu letter or empty and current char is Telugu letter => remove space
      // crude test: Telugu block \u0C00-\u0C7F
      const isLastTelugu = lastChar && /[\u0C00-\u0C7F]/.test(lastChar);
      const isCurTelugu = /[\u0C00-\u0C7F]/.test(ch);
      if (isCurTelugu && isLastTelugu) {
        // drop buffer (space)
        buffer = [];
        out += ch;
        continue;
      } else {
        // keep buffer + char
        out += buffer.join('') + ch;
        buffer = [];
        continue;
      }
    } else {
      out += ch;
    }
  }
  // final cleanup: collapse multiple spaces into single
  out = out.replace(/[ ]+/g, ' ');
  // trim each line
  out = out.split('\n').map(s => s.trim()).join('\n');
  return out.trim();
}

/* ============================
   Simple image resize function (same idea as earlier)
   ============================ */
async function resizeImageFile(file: File, minWidth = 100, maxWidth = 1200): Promise<Blob | File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let width = img.width < minWidth ? minWidth : img.width;
      if (width > maxWidth) width = maxWidth;
      const height = Math.round((img.height * width) / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('canvas context'));
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => {
        if (!blob) reject(new Error('toBlob failed')); else resolve(blob);
      }, file.type || 'image/png', 0.85);
    };
    img.onerror = () => reject(new Error('image load'));
    img.src = url;
  });
}

/* ============================
   Default mantras (you already provided — trimmed sample here)
   Keep them in-memory but they will NOT be exported in the user JSON.
   ============================ */
export const defaultRitualsMantras: { [slug: string]: RitualData } = {
  sriNamah: {
    title: "యాజ్ఞవల్క్య ప్రాథన",
    description: "యాజ్ఞవల్క్య ",
    instructions: [
      {
        mantra: [
          [{ char: "ఓం" }, { char: "వందేహం" }, { char: "మంగళాత్మానం" }],
          [{ char: "జితేంద్రియం" }, { char: "జితక్రోధం" }]
        ]
      }
    ]
  }
};

/* ============================
   Component
   ============================ */
export default function TantraEditorPage() {
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState("");
  const [pitchMarks, setPitchMarks] = useState<string[]>([]);
  const [status, setStatus] = useState("Upload image to start");
  const [mantras, setMantras] = useState<{[k:string]: RitualData}>({...defaultRitualsMantras});
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('userMantras');
    if (saved) {
      try {
        const obj = JSON.parse(saved);
        setMantras({...defaultRitualsMantras, ...obj});
      } catch (e) {
        console.error('userMantras parse failed', e);
      }
    } else {
      setMantras({...defaultRitualsMantras});
    }
  }, []);

const onAnalyze = async () => {
  const file = fileInput.current?.files?.[0];
  if (!file) {
    setStatus("Upload image first.");
    return;
  }

  try {
    setStatus("Preprocessing image...");
    const resized = await resizeImageFile(file, 100, 1200);
    const url = URL.createObjectURL(resized);

    setPreview(url);
    setStatus("Running OCR...");

    const { data } = await Tesseract.recognize(url, "tel", {
      logger: (m) => {
        if (m.status === "recognizing text") {
          setStatus(`Recognizing: ${(m.progress * 100).toFixed(0)}%`);
        }
      },
    });

    let text = (data.text || "").trim();

    // Remove weird characters, normalize spacing
    text = text.replace(/\u200C/g, " ").replace(/\s+/g, " ");

    // Combine Telugu split letters
    text = combineTeluguSpaces(text);

    setOcrText(text);

    const seg = new Intl.Segmenter("te", { granularity: "grapheme" });
    const parts = [...seg.segment(text)];
    setPitchMarks(parts.map(() => "none"));

    setStatus("OCR Complete ✔");
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    setStatus("OCR failed — try another image");
  }
};

  /* Pitch marking: mark selected graphemes as high/low */
  const applyPitch = (type: 'high' | 'low') => {
    const ta = document.getElementById('ocrBox') as HTMLTextAreaElement | null;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    if (start === end) {
      alert('Select text first');
      return;
    }
    const seg = new Intl.Segmenter('te', { granularity: 'grapheme' });
    const segs = Array.from(seg.segment(ocrText)).map(s => s.segment);
    let pos = 0;
    const updated = [...pitchMarks];
    for (let i = 0; i < segs.length; i++) {
      const next = pos + segs[i].length;
      if (pos < end && next > start) {
        updated[i] = type;
      }
      pos = next;
    }
    setPitchMarks(updated);
  };

  /* Save (create or update) — stores only userMantras in localStorage */
  const saveMantra = () => {
    if (!title.trim()) {
      alert('Please enter a title (any language). Title will be converted to English slug.');
      return;
    }
    // combine spaces in user edited OCR text before splitting
    const cleanedText = combineTeluguSpaces(ocrText || '');
    // segment to syllables
    const seg = new Intl.Segmenter('te', { granularity: 'grapheme' });
    const segs = Array.from(seg.segment(cleanedText)).map(s => s.segment);

    const lines: Syllable[][] = [];
    let current: Syllable[] = [];
    let pi = 0;
    for (let i = 0; i < segs.length; i++) {
      const ch = segs[i];
      if (ch === '\n') {
        if (current.length) {
          lines.push(current);
          current = [];
        }
        continue;
      }
      // If pitchMarks length shorter (user edited text), fallback to none
      const pitch = pitchMarks[i] && pitchMarks[i] !== 'none' ? (pitchMarks[i] as 'high'|'low') : undefined;
      current.push({ char: ch, ...(pitch ? { pitch } : {}) });
      pi++;
    }
    if (current.length) lines.push(current);

    // transliterate title & description for slug
    const slug = toEnglishSlug(title);
    const descEng = transliterateTeluguToLatin(desc);

    const mantraObj: RitualData = {
      title: title.trim(),
      description: descEng || desc.trim(),
      instructions: [{ mantra: lines }]
    };

    // read saved user data and update
    const savedRaw = localStorage.getItem('userMantras') || '{}';
    let savedObj: Record<string, RitualData> = {};
    try {
      savedObj = JSON.parse(savedRaw);
    } catch (e) {
      savedObj = {};
    }

    // if editing existing with different key, remove old
    if (editingKey && editingKey !== slug) {
      delete savedObj[editingKey];
    }

    savedObj[slug] = mantraObj;
    localStorage.setItem('userMantras', JSON.stringify(savedObj));
    // update app state (merge with defaults for display)
    setMantras({...defaultRitualsMantras, ...savedObj});
    setStatus('Mantra saved (user) ✔');
    setEditingKey(slug);
    // clear inputs (optional) - keep them to allow further editing
  };

  /* Load for edit */
  const editMantra = (key: string) => {
    // load from combined mantras (we prioritized saved userMantras earlier)
    const data = mantras[key];
    if (!data) return;
    // convert instructions (first instruction assumed)
    if (data.instructions && data.instructions.length) {
      const inst = data.instructions[0];
      if (typeof inst.mantra === 'string') {
        setOcrText(inst.mantra);
        const seg = new Intl.Segmenter('te', { granularity: 'grapheme' });
        const segs = Array.from(seg.segment(inst.mantra)).map(s => s.segment);
        setPitchMarks(segs.map(() => 'none'));
      } else {
        // flatten lines into text with newlines
        const text = inst.mantra.map(line => line.map(s => s.char).join('')).join('\n');
        setOcrText(text);
        // restore pitch marks
        const seg = new Intl.Segmenter('te', { granularity: 'grapheme' });
        const segs = Array.from(seg.segment(text)).map(s => s.segment);
        // map pitch marks from syllable objects
        const pm: string[] = [];
        for (const line of inst.mantra) {
          for (const syl of line) {
            pm.push(syl.pitch || 'none');
          }
          // we inserted newline - add an index for the newline if needed (we'll mark none)
          pm.push('none');
        }
        setPitchMarks(pm.slice(0, segs.length));
      }
    }
    setTitle(data.title);
    setDesc(data.description || '');
    setEditingKey(key);
    setStatus(`Editing: ${data.title}`);
    // scroll to top maybe
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* Delete user mantra */
  const deleteMantra = (key: string) => {
    if (!confirm(`Delete mantra "${mantras[key]?.title}"? This will remove from user storage.`)) return;
    const savedRaw = localStorage.getItem('userMantras') || '{}';
    let savedObj: Record<string, RitualData> = {};
    try { savedObj = JSON.parse(savedRaw); } catch (e) { savedObj = {}; }
    delete savedObj[key];
    localStorage.setItem('userMantras', JSON.stringify(savedObj));
    setMantras({ ...defaultRitualsMantras, ...savedObj });
    setStatus('Deleted user mantra');
    if (editingKey === key) {
      setEditingKey(null);
      setTitle('');
      setDesc('');
      setOcrText('');
      setPitchMarks([]);
    }
  };

  /* Download only user mantras as single JSON (English slugs + transliterated desc).
     Each key already is an English slug produced at save time. */
  const downloadUserJSON = () => {
    const raw = localStorage.getItem('userMantras') || '{}';
    let obj: Record<string, RitualData> = {};
    try { obj = JSON.parse(raw); } catch (e) { obj = {}; }
    // Ensure keys are English already (saveMantra enforced slug). But for safety, produce safe copies:
    const out: Record<string, RitualData> = {};
    for (const k of Object.keys(obj)) {
      const safeKey = /^[A-Za-z]/.test(k) ? k : `mantra_${Date.now()}`;
      out[safeKey] = obj[k];
    }
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_mantras.json';
    a.click();
    URL.revokeObjectURL(url);
    setStatus('User JSON downloaded');
  };

  /* Download merged HTML for Pandit review (includes both default and user) */
  const downloadReviewHTML = () => {
    // Use mantras (merged)
    const all = mantras;
    const fontLink = "https://fonts.gstatic.com"; // placeholder - we will include Noto Sans Telugu via Google fonts (CSP permitting)
    const htmlParts: string[] = [];
    htmlParts.push(`<!doctype html><html lang="te"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>AksharaTantra — Ritual Mantras</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@400;700&display=swap" rel="stylesheet">
    <style>body{font-family:'Noto Sans Telugu',sans-serif;padding:20px} h1{color:#1f2937} .mantra-line span{padding:2px;display:inline-block} .high{border-top:2px solid #1f3674} .low{border-bottom:2px solid #a08b5e} hr{margin:20px 0}</style></head><body>`);
    htmlParts.push(`<h1>AksharaTantra — Ritual Mantras (Review)</h1><p>Generated: ${new Date().toLocaleString()}</p><hr/>`);
    for (const key of Object.keys(all)) {
      const m = all[key];
      htmlParts.push(`<section><h2>${m.title}</h2>${m.description ? `<p>${m.description}</p>` : ''}`);
      m.instructions?.forEach(inst => {
        if (typeof inst.mantra === 'string') {
          htmlParts.push(`<p>${inst.mantra}</p>`);
        } else {
          inst.mantra.forEach(line => {
            const lineHtml = line.map(s => `<span class="${s.pitch? s.pitch : ''}">${s.char}</span>`).join('');
            htmlParts.push(`<p class="mantra-line">${lineHtml}</p>`);
          });
        }
      });
      htmlParts.push(`</section><hr/>`);
    }
    htmlParts.push('</body></html>');
    const blob = new Blob([htmlParts.join('')], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AksharaTantra_Mantras_Review.html';
    a.click();
    URL.revokeObjectURL(url);
    setStatus('Review HTML downloaded');
  };

  /* Small helper to load user file into editor (optional) */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPreview(URL.createObjectURL(f));
    setStatus('Image loaded — click Start OCR');
  };

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: 20 }}>
      <h1>🕉 అక్షరధార — OCR & శ్రుతి ఎడిటర్</h1>
      <div style={{ background: '#eef', padding: 10, borderRadius: 8, marginBottom: 15 }}>{status}</div>

      <section style={{ border: '1px solid #ddd', padding: 16, borderRadius: 8 }}>
        <h2>1) OCR Image → Mantra</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => fileInput.current?.click()} style={{ padding: '8px 12px' }}>Upload Image</button>
          <input ref={fileInput} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange}/>
          <button onClick={onAnalyze} style={{ padding: '8px 12px' }}>Start OCR</button>
          <button onClick={() => { setOcrText(''); setPitchMarks([]); setPreview(null); setTitle(''); setDesc(''); setEditingKey(null); setStatus('Cleared editor'); }} style={{ padding: '8px 12px' }}>Clear</button>
        </div>

        {preview && <div style={{ marginTop: 12 }}><img src={preview} alt="preview" style={{ maxWidth: '100%', borderRadius: 8 }} /></div>}

        <div style={{ marginTop: 12 }}>
          <label htmlFor="ocrBox"><strong>OCR Output / Edit</strong></label>
          <textarea id="ocrBox" value={ocrText} onChange={(e) => setOcrText(e.target.value)} rows={8} style={{ width: '100%', fontSize: 18, marginTop: 8, padding: 10 }} />
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <button onClick={() => applyPitch('high')}>High Pitch 🔼</button>
            <button onClick={() => applyPitch('low')}>Low Pitch 🔽</button>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <input placeholder="Mantra Title (any language) — will create English slug" value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: 8, fontSize: 16 }} />
          <textarea placeholder="Description (optional)" value={desc} onChange={e => setDesc(e.target.value)} rows={3} style={{ width: '100%', marginTop: 8, padding: 8 }} />
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <button onClick={saveMantra} style={{ padding: '8px 12px' }}>Save Mantra ✨</button>
            {editingKey && <button onClick={() => { /* remove editing state */ setEditingKey(null); setStatus('Stopped editing'); }}>Stop Edit</button>}
          </div>
        </div>
      </section>

      <section style={{ marginTop: 18, border: '1px solid #ddd', padding: 16, borderRadius: 8 }}>
        <h2>2) View / Manage Mantras</h2>

        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <button onClick={downloadUserJSON} style={{ background: '#2563eb', color: 'white', padding: '8px 10px', border: 'none', borderRadius: 6 }}>⬇ Download User JSON</button>
          <button onClick={downloadReviewHTML} style={{ background: '#16a34a', color: 'white', padding: '8px 10px', border: 'none', borderRadius: 6 }}>📘 Download Review HTML</button>
        </div>

        <div>
          {Object.keys(mantras).map((k) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderBottom: '1px solid #f1f1f1' }}>
              <div style={{ flexGrow: 1 }}>
                <strong>{mantras[k].title}</strong><br/>
                <small style={{ color: '#555' }}>{mantras[k].description}</small>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => editMantra(k)} style={{ padding: '6px 8px' }}>Edit</button>
                {/* Only allow deletion of user-mantras (not defaults) */}
                {localStorage.getItem('userMantras') && (() => {
                  try {
                    const user = JSON.parse(localStorage.getItem('userMantras') || '{}');
                    if (user && user[k]) {
                      return <button onClick={() => deleteMantra(k)} style={{ padding: '6px 8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 4 }}>Delete</button>;
                    }
                  } catch {}
                  return null;
                })()}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
