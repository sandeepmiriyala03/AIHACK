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
    <footer className="text-center p-4 border-t border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 mt-10 select-none text-sm">
      <nav aria-label="Footer navigation" className="mb-3">
        <Link href="/upload" className="mx-3 hover:text-blue-700 dark:hover:text-blue-400">
          ⬆️ Upload document
        </Link>
        <Link href="/OCR" className="mx-3 hover:text-blue-700 dark:hover:text-blue-400">
          ⬆️ Image to Text
        </Link>
      </nav>
      <p className="mb-1">
        Developed by Sandeep Miriyala&nbsp;|&nbsp;
        <img
          src="https://upload.wikimedia.org/wikipedia/en/4/41/Flag_of_India.svg"
          alt="Indian Flag"
          className="inline-block w-5 h-3 align-middle mx-1"
        />
        IST: {currentTime} &nbsp;|&nbsp; © {currentYear}
      </p>
      <p>
        Last deployed on: <span className="font-semibold">{lastDeployed}</span>
      </p>
    </footer>
  );
}
