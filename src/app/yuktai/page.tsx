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
          <p>npm update yuktai-js check always  vsc terminal. </p>
        </div>


    </>
  );
}