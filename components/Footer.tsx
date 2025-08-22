"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const options: Intl.DateTimeFormatOptions = {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "Asia/Kolkata",
      };
      const time = new Intl.DateTimeFormat("en-IN", options).format(new Date());
      setCurrentTime(time);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);
  const lastDeployed = process.env.NEXT_PUBLIC_LAST_DEPLOYED || "N/A";
  return (
    <footer
      style={{
        textAlign: "center",
        padding: "1rem 0",
        borderTop: "1px solid #eaeaea",
        fontSize: "0.9rem",
        color: "#666",
        marginTop: "2rem",
        userSelect: "none",
      }}
    >
      <nav aria-label="Footer navigation" style={{ marginBottom: 12 }}>
        <Link href="/upload" style={{ margin: "0 12px" }}>
          <span className="icon upload-icon" aria-label="Upload">
                ⬆️
              </span> Upload document
        </Link>
        <Link href="/OCR" style={{ margin: "0 12px" }}>
         <span className="icon upload-icon" aria-label="Upload">
                ⬆️
              </span> Image to Text
        </Link>
      </nav>
     <p>
  Developed by Sandeep Miriyala using Next.js&nbsp;|&nbsp;
  <img
    src="https://upload.wikimedia.org/wikipedia/en/4/41/Flag_of_India.svg"
    alt="Indian Flag"
    style={{ width: 20, height: 14, verticalAlign: "middle", margin: "0 6px" }}
  />
  IST: {currentTime} &nbsp;|&nbsp; © {currentYear}
</p>
<p>
        Last deployed on: <span className="font-semibold">{lastDeployed}</span>
      </p>
    </footer>
  );
}
