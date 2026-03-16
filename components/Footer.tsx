"use client";

import React, { useEffect, useState } from "react";
import styles from "../Styles/Footer.module.css";

export default function Footer() {
  const year = new Date().getFullYear();
  const [timeIST, setTimeIST] = useState("");

  useEffect(() => {
    const updateIST = () => {
      const formatter = new Intl.DateTimeFormat("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "Asia/Kolkata",
      });
      setTimeIST(formatter.format(new Date()));
    };

    updateIST();
    const timer = setInterval(updateIST, 1000);
    return () => clearInterval(timer);
  }, []);

  const deployedDate = process.env.NEXT_PUBLIC_LAST_DEPLOYED || "N/A";

  return (
    <footer className={styles.footer}>
      {/* Branding Row */}
      <div className={styles.row}>
        <span className={styles.icon}>🤖</span> Yuktishaalaa AI Lab &nbsp; | &nbsp;
        <span className={styles.icon}>👨‍💻</span> Sandeep Miriyala &nbsp; | &nbsp;
        ⚛️ Mobile + AI Engineering
      </div>

      {/* Time + Year */}
      <div className={styles.row}>
        © {year} • IST Time: <strong>{timeIST}</strong>
      </div>

      {/* Deployment Info */}
      <div className={styles.deployRow}>
        <span className={styles.deployIcon}>📅</span>
        Last Deployed: <span className={styles.deployDate}>{deployedDate}</span>
      </div>
    </footer>
    
  );
}
