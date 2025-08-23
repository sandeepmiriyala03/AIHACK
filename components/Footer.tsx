"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "../Styles/Footer.module.css";
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
    <footer className={styles.footer}>
      <nav aria-label="Footer navigation" className={styles.nav}>
        <Link href="/upload" className={styles.navLink}>
          <span className="icon upload-icon" aria-label="Upload">⬆️</span> Upload document
        </Link>
        <Link href="/OCR" className={styles.navLink}>
          <span className="icon upload-icon" aria-label="Upload">⬆️</span> Image to Text
        </Link>
      </nav>
      <p>
        Developed by Sandeep Miriyala using Next.js&nbsp;|&nbsp;
        <span className={styles.flagWrapper}>
          <Image
            src="https://upload.wikimedia.org/wikipedia/en/4/41/Flag_of_India.svg"
            alt="Indian Flag"
            layout="fill"
            objectFit="contain"
            priority
          />
        </span>
        IST: {currentTime} &nbsp;|&nbsp; © {currentYear}
      </p>
      <p>
        Last deployed on: <span className="font-semibold">{lastDeployed}</span>
      </p>
    </footer>
  );
}
