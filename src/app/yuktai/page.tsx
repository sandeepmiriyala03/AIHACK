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

    
        {/* Demo */}
        <div style={{ marginTop: 30 }}>
          <YuktAIBox />
        </div>


    </>
  );
}