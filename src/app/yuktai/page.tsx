"use client";

import { useState } from "react";
import YuktAIBox from "@/components/YuktAIBox";
import YuktAI from "yuktai-js";
import Navbar from "@/components/Navbar";

import SmartToyIcon from "@mui/icons-material/SmartToy";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import IntegrationInstructionsIcon from "@mui/icons-material/IntegrationInstructions";

export default function Home() {
  const [output, setOutput] = useState("");

  const runDirect = async () => {
    const res = await YuktAI.run("ai.text", "Hello from page 🚀");
    setOutput(res);
  };

  return (
    <>
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main style={{ padding: 30, maxWidth: 800, margin: "auto" }}>
        
        {/* 🔥 Branding */}
        <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <SmartToyIcon /> YuktAI
        </h1>
        <p style={{ color: "#666", marginBottom: 20 }}>
          AI Engine — Do more with less
        </p>

        {/* Paragraph 1 */}
        <p>
          YuktAI is a lightweight AI engine that you built and hosted on GitHub.
          Instead of publishing to npm, you can directly install and use it inside
          your Next.js project. It works like any other library and can process
          text, voice, and plugins through a simple runtime system.
        </p>

        {/* Paragraph 2 */}
        <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CloudDownloadIcon /> How YuktAI is Used
        </h3>
        <p>
          When you install YuktAI from GitHub, it gets downloaded into your
          project’s <b>node_modules</b> folder. From there, you can import it using{" "}
          <b>{'"yuktai-js"'}</b> and call its functions just like a normal npm
          package.
        </p>

        {/* Paragraph 3 */}
        <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <IntegrationInstructionsIcon /> How It Works
        </h3>
        <p>
          The flow is simple: your UI sends input → YuktAI runtime receives it →
          the correct plugin is executed → and the processed result is returned.
        </p>

        {/* Demo */}
        <div style={{ marginTop: 30 }}>
          <YuktAIBox />
        </div>

        {/* Direct Usage */}
        <div style={{ marginTop: 40 }}>
          <h3>Quick Test (Direct Call)</h3>

          <button
            onClick={runDirect}
            style={{
              padding: "10px 16px",
              cursor: "pointer",
              marginTop: 10,
            }}
          >
            Run YuktAI Directly
          </button>

          <p style={{ marginTop: 15 }}>
            <b>Output:</b> {output}
          </p>
        </div>
      </main>
    </>
  );
}