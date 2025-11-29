"use client";

import { useEffect, useRef, useState } from "react";
import Tesseract from "tesseract.js";

/* ============================================================
   TYPES
============================================================ */
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

export type PreliminaryVerse = {
  verse: string | Syllable[];
  recitation?: string;
  action?: string;
};

export type RitualData = {
  title: string;
  description?: string;
  preliminaryVerses?: PreliminaryVerse[];
  videoUrl?: string;
  explanation?: string;
  instructions?: AchamanamInstruction[];
  imageUrl?: string;
};

/* ============================================================
   DEFAULT MANTRA DATA
============================================================ */
export const defaultRitualsMantras: { [slug: string]: RitualData } = {
  sriNamah: {
    title: "యాజ్ఞవల్క్య ప్రార్థన",
    description: "యాజ్ఞవల్క్య ",
    instructions: [
      {
        mantra: [
          [
            { char: "ఓం" },
            { char: "వందేహం" },
            { char: "మంగళాత్మానం" },
            { char: "భాస్వంతం" },
            { char: "వేద" },
            { char: "విగ్రహమ్" },
            { char: "|" },
            { char: "యజ్ఞవల్క్యం" },
            { char: "మునిశ్రేష్ఠం" },
            { char: "జిష్ణుం" },
            { char: "హరిహర" },
            { char: "ప్రభుమ్" },
            { char: "||" }
          ],
          [
            { char: "జితేంద్రియం" },
            { char: "జితక్రోధం" },
            { char: "సదాధ్యాన" },
            { char: "పరాయణం" },
            { char: "|" },
            { char: "ఆనందనిలయం" },
            { char: "వందే" },
            { char: "యోగానంద" },
            { char: "మునీశ్వరమ్" },
            { char: "||" }
          ]
        ]
      }
    ]
  }
};

/* ============================================================
   IMAGE RESIZE FUNCTION
============================================================ */
async function resizeImageFile(file: File, minWidth: number, maxWidth: number): Promise<File | Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let width = img.width < minWidth ? minWidth : img.width;
      if (width > maxWidth) width = maxWidth;

      const height = Math.round((img.height * width) / img.width);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas error"));
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Resize failed"))),
        file.type || "image/png",
        0.85
      );
    };

    img.onerror = () => reject(new Error("Image load failed"));
    img.src = url;
  });
}

/* ============================================================
   COMPONENT START
============================================================ */
export default function TantraEditorPage() {
  const [mantras, setMantras] = useState(defaultRitualsMantras);
  const [status, setStatus] = useState("Upload image to start");
  const [ocrText, setOcrText] = useState("");
  const [pitchMarks, setPitchMarks] = useState<string[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [currentKey, setCurrentKey] = useState<string | null>(null);

  const fileInput = useRef<HTMLInputElement>(null);

  /* ============================================================
     LOAD DEFAULT + USER DATA
  ============================================================ */
  useEffect(() => {
    const saved = localStorage.getItem("userMantras");
    if (saved) {
      const userData = JSON.parse(saved);
      setMantras({ ...defaultRitualsMantras, ...userData });
    }
  }, []);

  /* ============================================================
     ON FILE UPLOAD
  ============================================================ */
  const handleUpload = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setStatus("Image loaded. Start OCR.");
  };

  /* ============================================================
     OCR PROCESS — using your onAnalyze logic
  ============================================================ */
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
        }
      });

      const cleaned = (data.text || "").replace(/\s+/g, " ").trim();
      setOcrText(cleaned);

      const seg = new Intl.Segmenter("te", { granularity: "grapheme" });
      const chars = [...seg.segment(cleaned)];
      setPitchMarks(chars.map(() => "none"));

      setStatus("OCR Complete");
      URL.revokeObjectURL(url);
    } catch (err) {
      setStatus("OCR failed");
    }
  };

  /* ============================================================
     APPLY PITCH MARK
  ============================================================ */
  const applyPitch = (type: "high" | "low") => {
    const textarea = document.getElementById("ocrBox") as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start === end) {
      alert("Select text first");
      return;
    }

    const seg = new Intl.Segmenter("te", { granularity: "grapheme" });
    const segs = [...seg.segment(ocrText)];

    const updated = [...pitchMarks];
    let pos = 0;

    segs.forEach((s, i) => {
      const next = pos + s.segment.length;
      if (pos < end && next > start) updated[i] = type;
      pos = next;
    });

    setPitchMarks(updated);
  };

  /* ============================================================
     SAVE MANTRA
  ============================================================ */
  const saveMantra = () => {
    if (!title.trim()) return alert("Enter Title");

    const seg = new Intl.Segmenter("te", { granularity: "grapheme" });
    const chars = [...seg.segment(ocrText)];

    let lines: Syllable[][] = [];
    let current: Syllable[] = [];

    chars.forEach((g, i) => {
      if (g.segment === "\n") {
        if (current.length) lines.push(current);
        current = [];
      } else {
        current.push({
          char: g.segment,
          pitch: pitchMarks[i] !== "none" ? (pitchMarks[i] as any) : undefined
        });
      }
    });

    if (current.length) lines.push(current);

    const key = title.replace(/\s+/g, "");

    const newMantra: RitualData = {
      title,
      description: desc,
      instructions: [{ mantra: lines }]
    };

    const saved = JSON.parse(localStorage.getItem("userMantras") || "{}");
    const updated = { ...saved, [key]: newMantra };

    localStorage.setItem("userMantras", JSON.stringify(updated));
    setMantras({ ...defaultRitualsMantras, ...updated });

    setStatus("Mantra Saved ✔");
    setCurrentKey(key);
  };

  /* ============================================================
     DOWNLOAD JSON EXPORT
  ============================================================ */
  const downloadAllMantras = () => {
    const userData = JSON.parse(localStorage.getItem("userMantras") || "{}");

    const exportData = {
      default: defaultRitualsMantras,
      user: userData,
      merged: { ...defaultRitualsMantras, ...userData }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "aksharatantra_mantras.json";
    a.click();

    URL.revokeObjectURL(url);
    setStatus("JSON Exported");
  };

  /* ============================================================
     DOWNLOAD HTML BOOK — pandit review version
  ============================================================ */
  const downloadHTML = () => {
    const all = mantras;

    let html = `
<!DOCTYPE html>
<html lang="te">
<head>
<meta charset="UTF-8" />
<title>Ritual Mantras Book</title>
<style>
  body { font-family: 'Noto Sans Telugu', sans-serif; padding:20px; line-height:1.9; }
  h1,h2,h3 { color:#4b0082; }
  .mantra-line span { padding:3px; }
  .high { border-top:2px solid blue; }
  .low { border-bottom:2px solid brown; }
</style>
</head>
<body>
<h1>📘 AksharaTantra — Ritual Mantras Book</h1>
<p>Generated for review by Vedic Pandits</p>
<hr/>
`;

    Object.keys(all).forEach((slug) => {
      const m = all[slug];

      html += `<h2>${m.title}</h2>`;
      if (m.description) html += `<p>${m.description}</p>`;

      m.instructions?.forEach((inst) => {
        if (typeof inst.mantra === "string") {
          html += `<p>${inst.mantra}</p>`;
        } else {
          inst.mantra.forEach((line) => {
            html += `<p class="mantra-line">`;
            line.forEach((s) => {
              html += `<span class="${s.pitch || ""}">${s.char}</span>`;
            });
            html += `</p>`;
          });
        }
      });

      html += `<hr/>`;
    });

    html += `</body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "RitualMantrasBook.html";
    a.click();

    URL.revokeObjectURL(url);
    setStatus("HTML Exported");
  };

  /* ============================================================
     RENDER MANTRA
  ============================================================ */
  const renderMantra = (key: string) => {
    const data = mantras[key];
    if (!data) return null;

    return (
      <div style={{ marginTop: 20 }}>
        <h3>{data.title}</h3>
        <p>{data.description}</p>

        {data.instructions?.map((inst, idx) =>
          typeof inst.mantra === "string" ? (
            <p key={idx}>{inst.mantra}</p>
          ) : (
            inst.mantra.map((line, i) => (
              <p key={i}>
                {line.map((s, j) => (
                  <span
                    key={j}
                    style={{
                      padding: 4,
                      display: "inline-block",
                      borderTop: s.pitch === "high" ? "2px solid blue" : "",
                      borderBottom: s.pitch === "low" ? "2px solid brown" : ""
                    }}
                  >
                    {s.char}
                  </span>
                ))}
              </p>
            ))
          )
        )}
      </div>
    );
  };

  /* ============================================================
     JSX RETURN
  ============================================================ */
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
      <h1>🕉 అక్షరధార - OCR & శ్రుతి ఎడిటర్</h1>

      <div style={{ marginBottom: 15, padding: 10, background: "#eef" }}>
        {status}
      </div>

      {/* OCR SECTION */}
      <div style={{ padding: 20, border: "1px solid #ddd", borderRadius: 10 }}>
        <h2>1) OCR Image → Mantra</h2>

        <button onClick={() => fileInput.current?.click()}>Upload Image</button>

        <input
          type="file"
          ref={fileInput}
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleUpload}
        />

        {preview && (
          <img src={preview} style={{ width: "100%", marginTop: 20, borderRadius: 10 }} />
        )}

        <button onClick={onAnalyze} style={{ marginTop: 20 }}>
          Start OCR
        </button>

        <textarea
          id="ocrBox"
          style={{ marginTop: 20, width: "100%", minHeight: 150 }}
          value={ocrText}
          onChange={(e) => setOcrText(e.target.value)}
        />

        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <button onClick={() => applyPitch("high")}>High Pitch 🔼</button>
          <button onClick={() => applyPitch("low")}>Low Pitch 🔽</button>
        </div>

        <input
          type="text"
          placeholder="Mantra Title"
          style={{ width: "100%", marginTop: 20 }}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          placeholder="Description"
          style={{ width: "100%", marginTop: 10 }}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />

        <button onClick={saveMantra} style={{ marginTop: 15 }}>
          Save Mantra ✨
        </button>
      </div>

      {/* VIEW MANTRAS */}
      <div style={{ marginTop: 30, padding: 20, border: "1px solid #ddd", borderRadius: 10 }}>
        <h2>2) View Mantras</h2>

        <button
          onClick={downloadAllMantras}
          style={{
            background: "#2563eb",
            color: "white",
            marginBottom: 10,
            padding: "10px 15px",
            borderRadius: 6,
            width: "100%",
            border: "none",
            cursor: "pointer"
          }}
        >
          ⬇ Download All Mantras (JSON)
        </button>

        <button
          onClick={downloadHTML}
          style={{
            background: "#16a34a",
            color: "white",
            marginBottom: 20,
            padding: "10px 15px",
            borderRadius: 6,
            width: "100%",
            border: "none",
            cursor: "pointer"
          }}
        >
          📘 Download HTML Book (For Pandit Review)
        </button>

        {Object.keys(mantras).map((key) => (
          <button
            key={key}
            onClick={() => setCurrentKey(key)}
            style={{
              display: "block",
              width: "100%",
              marginBottom: 5,
              padding: 10,
              textAlign: "left"
            }}
          >
            {mantras[key].title}
          </button>
        ))}

        {currentKey && renderMantra(currentKey)}
      </div>
    </div>
  );
}
