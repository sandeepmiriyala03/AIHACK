"use client";

import React, { useEffect, useState } from "react";
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
      <p className={styles.attribution}>
    
        <span className={styles.symbol}>🤖</span>
        Yukthisala AI Lab &nbsp;&nbsp;
        <span className={styles.symbol}>👨‍💻</span>
        Sandeep Miriyala&nbsp;&nbsp;
     ⚛️&nbsp;&nbsp; 📱 &nbsp;&nbsp;
        &nbsp; © {currentYear} &nbsp;&nbsp; IST: {currentTime} &nbsp;
        <span className={styles.flagWrapper}>
          <Image
            src="https://upload.wikimedia.org/wikipedia/en/4/41/Flag_of_India.svg"
            alt="Indian Flag"
            layout="fill"
            objectFit="contain"
            priority
          />
        </span>
      </p>
     <p className={styles.deployment}>
  <span className={styles.deploymentSymbol}>📅 </span> Deployed on: <span className={styles.deploymentDate}>{lastDeployed}</span>
</p>
    </footer>
  );
}
