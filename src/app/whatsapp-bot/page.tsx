"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import QrCodeScannerRoundedIcon from "@mui/icons-material/QrCodeScannerRounded";
import PlayCircleFilledRoundedIcon from "@mui/icons-material/PlayCircleFilledRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";

const G = "#10b981";
const TEXT_MAIN = "#0f172a";
const TEXT_SUB = "#64748b";

export default function WhatsAppBotPage() {
  // UI States
  const [botStatus, setBotStatus] = useState<"disconnected" | "generating_qr" | "ready" | "sending">("disconnected");
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [configTime, setConfigTime] = useState("07:00");
  const [customMessage, setCustomMessage] = useState("శుభోదయం! 🌞 మీ రోజు అద్భుతంగా సాగాలని కోరుకుంటున్నాను. - AksharaTantra AI Bot");

  // లాగ్స్ యాడ్ చేయడానికి చిన్న హెల్పర్
  const addLog = (msg: string) => {
    setLogMessages((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  // బాట్‌ను స్టార్ట్ చేసి QR కోడ్ జనరేట్ చేసే సిమ్యులేటెడ్ యాక్షన్
  const handleStartBot = async () => {
    setBotStatus("generating_qr");
    addLog("Initializing WhatsApp Web Core via Puppeteer headless boundary...");
    
    // సిమ్యులేటెడ్ సర్వర్ రెస్పాన్స్ (Next.js API API Wrapper)
    setTimeout(() => {
      // ఇక్కడ ఒక డమ్మీ QR కోడ్ ఇమేజ్ ఇస్తున్నాను. 
      // ఒరిజినల్ సర్వర్ రన్ అయినప్పుడు బ్యాకెండ్ జెనరేట్ చేసే 'whatsapp-qr.png' ని ఇది ఫెచ్ చేస్తుంది.
      setQrCodeUrl("https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=AksharaTantraYuktaiBotAuthenticationToken");
      addLog("QR Code successfully generated! Please scan using Linked Devices.");
    }, 2000);
  };

  // QR స్కాన్ కంప్లీట్ అయినట్లు సిమ్యులేట్ చేయడానికి
  const handleSimulateScan = () => {
    setBotStatus("ready");
    setQrCodeUrl(null);
    addLog("Session authenticated successfully! LocalAuth token saved.");
    addLog(`Cron schedule injected: Active every day at ${configTime} IST.`);
  };

  // మెసేజ్‌లను కాంటాక్ట్స్‌కి పంపడం స్టార్ట్ చేయడం
  const handleTriggerBroadcast = () => {
    setBotStatus("sending");
    addLog("Fetching client.getContacts() payload from Google & WhatsApp sync...");
    
    const sampleContacts = ["Sandeep Miriyala", "Anil Kumar", "Vedic Labs Group (Skipped - Group Filter)", "Rajesh Telugudev", "Amma Phone"];
    
    sampleContacts.forEach((contact, index) => {
      setTimeout(() => {
        if (contact.includes("Group")) {
          addLog(`⚠️ Filtered out: ${contact}`);
        } else {
          addLog(`📨 Message systematically sent to: ${contact} (3s anti-ban delay applied)`);
        }
        
        if (index === sampleContacts.length - 1) {
          setBotStatus("ready");
          addLog("✅ Daily automated broadcast completed successfully for all individual contacts!");
        }
      }, (index + 1) * 2500);
    });
  };

  return (
    <main style={{ maxWidth: "850px", margin: "100px auto 60px auto", padding: "0 24px", fontFamily: "'Outfit', sans-serif", color: TEXT_MAIN, boxSizing: "border-box" }}>
      
      {/* Back Button */}
      <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: G, textDecoration: "none", fontSize: "14px", fontWeight: 600, marginBottom: "20px" }}>
        <ArrowBackRoundedIcon style={{ fontSize: 16 }} /> Back to Dashboard
      </Link>

      {/* Header */}
      <header style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "20px", marginBottom: "30px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <WhatsAppIcon style={{ color: G, fontSize: "36px" }} />
          <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>Automated Morning WhatsApp Bot</h1>
        </div>
        <p style={{ fontSize: "15px", color: TEXT_SUB, marginTop: "6px" }}>
          Next.js Server-Side Integration for Client Contact Auto-Messaging & Scheduler.
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "window.innerWidth > 768 ? '1fr 1fr' : '1fr'", gap: "24px" }}>
        
        {/* Left Side: Controls & Configuration */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Section 1: Scheduler Configuration */}
          <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, marginTop: 0, marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              <PendingActionsRoundedIcon style={{ color: G }} /> 1. Automation Settings
            </h3>
            
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: TEXT_SUB, marginBottom: "6px" }}>Trigger Time (Every Morning)</label>
            <input 
              type="time" 
              value={configTime} 
              onChange={(e) => setConfigTime(e.target.value)} 
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginBottom: "16px", fontFamily: "inherit" }}
            />

            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: TEXT_SUB, marginBottom: "6px" }}>Morning Message Content</label>
            <textarea 
              rows={3}
              value={customMessage} 
              onChange={(e) => setCustomMessage(e.target.value)} 
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontFamily: "inherit", fontSize: "14px", resize: "none" }}
            />
          </div>

          {/* Section 2: Bot Activation */}
          <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, marginTop: 0, marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              <QrCodeScannerRoundedIcon style={{ color: G }} /> 2. Server Authentication
            </h3>

            {botStatus === "disconnected" && (
              <button onClick={handleStartBot} style={{ width: "100%", background: G, color: "white", border: "none", padding: "12px", borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}>
                Generate QR Code Session
              </button>
            )}

            {botStatus === "generating_qr" && (
              <div style={{ textAlign: "center", padding: "10px", color: TEXT_SUB, fontSize: "14px" }}>
                🔄 Spinning up headless browser context...
              </div>
            )}

            {qrCodeUrl && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", marginTop: "10px" }}>
                <img src={qrCodeUrl} alt="WhatsApp QR Code" style={{ border: "4px solid white", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                <span style={{ fontSize: "12px", color: TEXT_SUB, textAlign: "center" }}>Open WhatsApp &gt; Linked Devices &gt; Scan QR</span>
                <button onClick={handleSimulateScan} style={{ background: "#0f172a", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}>
                  Confirm Scanned Successfully
                </button>
              </div>
            )}

            {botStatus === "ready" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ background: "#d1fae5", color: "#065f46", padding: "10px", borderRadius: "8px", fontSize: "14px", fontWeight: 500, textAlign: "center" }}>
                  ● Bot Status: ACTIVE & SCHEDULED
                </div>
                <button onClick={handleTriggerBroadcast} style={{ width: "100%", background: "#0284c7", color: "white", border: "none", padding: "12px", borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  <PlayCircleFilledRoundedIcon /> Test Broadcast to Contacts Now
                </button>
              </div>
            )}

            {botStatus === "sending" && (
              <div style={{ background: "#fef3c7", color: "#92400e", padding: "10px", borderRadius: "8px", fontSize: "14px", fontWeight: 500, textAlign: "center" }}>
                ⏳ Sending broadcast... (Anti-Ban Interval Active)
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Live Terminal Engine Logs */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ background: "#0f172a", color: "#34d399", borderRadius: "16px", padding: "20px", fontFamily: "monospace", fontSize: "13px", height: "360px", overflowY: "auto", display: "flex", flexDirection: "column-reverse", gap: "8px", border: "1px solid #1e293b" }}>
            {logMessages.length === 0 ? (
              <div style={{ color: "#64748b" }}>&gt;_ System logs will stream here. Awaiting token generation...</div>
            ) : (
              logMessages.map((log, index) => <div key={index}>{log}</div>)
            )}
          </div>
        </div>

      </div>

      {/* Footer Disclaimer */}
      <footer style={{ marginTop: "40px", borderTop: "1px solid #e2e8f0", paddingTop: "16px", fontSize: "13px", color: TEXT_SUB, display: "flex", alignItems: "center", gap: "6px" }}>
        <GroupRoundedIcon style={{ fontSize: 16 }} />
        <span><strong>Note:</strong> Next.js builds auto-isolate background threads. Make sure your server container has `puppeteer` dependencies installed.</span>
      </footer>
    </main>
  );
}