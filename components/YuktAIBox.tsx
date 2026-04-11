"use client";

import { useState } from "react";
import YuktAI from "yuktai-js";

export default function YuktAIBox() {
  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");

  const handleRun = async () => {
    if (!input) return;

    const res = await YuktAI.run("ai.text", input);
    setOutput(res);
  };

  const handleVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.start();

    recognition.onresult = async (event: any) => {
      const text = event.results[0][0].transcript;

      const voiceText = await YuktAI.run("voice.text", text);
      const aiResult = await YuktAI.run("ai.text", voiceText);

      setInput(text);
      setOutput(aiResult);
    };
  };

  return (
    <div style={{ padding: 20, maxWidth: 500 }}>
      <h2>🤖 YuktAI (AI + Voice)</h2>

      <input
        type="text"
        placeholder="Enter text..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{ padding: 10, width: "100%", marginBottom: 10 }}
      />

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={handleRun} style={btnStyle}>
          <span className="material-icons">smart_toy</span>
          Run AI
        </button>

        <button onClick={handleVoice} style={btnStyle}>
          <span className="material-icons">mic</span>
          Speak
        </button>
      </div>

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