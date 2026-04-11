"use client";

import { useState } from "react";
import YuktAI from "yuktai-js";

export default function Page() {
  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");

  const handleRun = async () => {
    if (!input) return;

    const res = await YuktAI.run("ai.text", input);
    setOutput(res);
  };

  return (
    <div style={{ padding: 20, maxWidth: 500 }}>
      
      {/* 🔥 Branding */}
      <h1 style={{ marginBottom: 5 }}>YuktAI</h1>
      <p style={{ color: "#666", marginBottom: 20 }}>
        AI Engine — Do more with less
      </p>

      <h2>🤖 AI</h2>

      <p>{'Use "ai.text" plugin easily'}</p>

      <input
        type="text"
        placeholder="Type something..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{ padding: 10, width: "100%", marginBottom: 10 }}
      />

      {/* ✅ FIXED BUTTON */}
      <button onClick={handleRun} style={btnStyle}>
        🤖 Run AI
      </button>

      <p style={{ marginTop: 20 }}>
        <b>Output:</b> {output}
      </p>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "10px 14px",
  cursor: "pointer",
};