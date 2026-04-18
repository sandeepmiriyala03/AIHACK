"use client";

import { useState } from "react";
import YuktAIBox from "@/components/YuktAIBox";



import Navbar from "@/components/Navbar";

export default function Home() {
  const [output, setOutput] = useState("");

  return (
    <>
      {/* Navbar */}
      <Navbar />

    
        {/* Demo */}
        <div style={{ marginTop: 30 }}>
          <YuktAIBox />
          <p>npm update yuktai-js check always in VS Code terminal.</p>
          <div style={{
            marginTop: 20,
            padding: 16,
            borderRadius: 14,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            color: "#334155",
            fontSize: 14,
            lineHeight: 1.6,
          }}>
            <strong>Note:</strong> This YuktAI feature also works from another repo by installing it as a node module. You can use the package.json and package-lock.json in your local repo to install and manage dependencies. It supports React, Angular, Next.js, and other modern frameworks, so you do not need to change core code—just import and call the module. For more details, see <a href="https://github.com/sandeepmiriyala03/yuktai" target="_blank" rel="noreferrer" style={{ color: "#0f766e", textDecoration: "underline" }}>https://github.com/sandeepmiriyala03/yuktai</a>.
          </div>
        </div>


    </>
  );
}