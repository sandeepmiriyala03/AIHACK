"use client";

import { useState } from "react";

const GREETINGS = [
  { id: "morning",   label: "🌅 Good Morning",   text: "శుభోదయం! 🌞 Good Morning! Have a wonderful day ahead. — AksharaTantra" },
  { id: "afternoon", label: "☀️ Good Afternoon",  text: "శుభ మధ్యాహ్నం! ☀️ Good Afternoon! Hope your day is going great. — AksharaTantra" },
  { id: "evening",   label: "🌇 Good Evening",    text: "శుభ సాయంత్రం! 🌇 Good Evening! Relax and enjoy your evening. — AksharaTantra" },
  { id: "night",     label: "🌙 Good Night",      text: "శుభ రాత్రి! 🌙 Good Night! Sleep well and wake up refreshed. — AksharaTantra" },
  { id: "hi",        label: "👋 Hi / How Are You", text: "హాయ్! 👋 Hi! How are you doing? Hope you're having a great time. — AksharaTantra" },
];

export default function GreetingBot() {
  const [phone,    setPhone]    = useState("");
  const [selected, setSelected] = useState(null);
  const [custom,   setCustom]   = useState("");
  const [sending,  setSending]  = useState(false);
  const [result,   setResult]   = useState(null); // "success" | "error"
  const [errMsg,   setErrMsg]   = useState("");

  const messageToSend = selected === "custom" ? custom : GREETINGS.find(g => g.id === selected)?.text ?? "";

  async function handleSend() {
    if (!phone.trim() || !messageToSend.trim()) return;
    setSending(true);
    setResult(null);

    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim().replace(/\D/g, ""), message: messageToSend }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setResult("success");
        setPhone("");
        setSelected(null);
      } else {
        setResult("error");
        setErrMsg(data.error ?? "Something went wrong.");
      }
    } catch (e) {
      setResult("error");
      setErrMsg("Network error — please try again.");
    }

    setSending(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "system-ui,sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Header */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📱</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 6px", color: "#0f172a" }}>AksharaTantra Greetings</h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>Send a WhatsApp greeting instantly</p>
        </div>

        {/* Phone input */}
        <div style={card}>
          <label style={labelStyle}>📞 WhatsApp Number</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ padding: "10px 12px", background: "#f1f5f9", borderRadius: 8, border: "0.5px solid #cbd5e1", fontSize: 13, color: "#475569", flexShrink: 0 }}>+91</span>
            <input
              type="tel"
              placeholder="98765 43210"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              maxLength={15}
              style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "0.5px solid #cbd5e1", fontFamily: "inherit", fontSize: 14, outline: "none", color: "#0f172a" }}
            />
          </div>
          <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>Enter number with country code — e.g. 919876543210</p>
        </div>

        {/* Greeting picker */}
        <div style={card}>
          <label style={labelStyle}>💬 Pick a Greeting</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {GREETINGS.map(g => (
              <div
                key={g.id}
                onClick={() => setSelected(g.id)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: selected === g.id ? "1.5px solid #1D9E75" : "0.5px solid #e2e8f0",
                  background: selected === g.id ? "#f0fdf9" : "#fff",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{g.label}</span>
                <span style={{ fontSize: 11, color: "#64748b", lineHeight: 1.4 }}>{g.text}</span>
              </div>
            ))}

            {/* Custom option */}
            <div
              onClick={() => setSelected("custom")}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: selected === "custom" ? "1.5px solid #1D9E75" : "0.5px solid #e2e8f0",
                background: selected === "custom" ? "#f0fdf9" : "#fff",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>✏️ Custom Message</span>
              {selected === "custom" && (
                <textarea
                  rows={3}
                  placeholder="Type your message here…"
                  value={custom}
                  onChange={e => { e.stopPropagation(); setCustom(e.target.value); }}
                  onClick={e => e.stopPropagation()}
                  maxLength={300}
                  style={{ display: "block", width: "100%", marginTop: 8, padding: "8px 10px", borderRadius: 8, border: "0.5px solid #cbd5e1", fontFamily: "inherit", fontSize: 13, resize: "none", boxSizing: "border-box", outline: "none" }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Result messages */}
        {result === "success" && (
          <div style={{ background: "#d1fae5", color: "#065f46", padding: "12px 16px", borderRadius: 10, fontSize: 14, textAlign: "center" }}>
            ✅ Message sent successfully on WhatsApp!
          </div>
        )}
        {result === "error" && (
          <div style={{ background: "#fee2e2", color: "#991b1b", padding: "12px 16px", borderRadius: 10, fontSize: 14, textAlign: "center" }}>
            ❌ {errMsg}
          </div>
        )}

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={sending || !phone.trim() || !messageToSend.trim()}
          style={{
            padding: "14px",
            borderRadius: 10,
            border: "none",
            background: (sending || !phone.trim() || !messageToSend.trim()) ? "#94a3b8" : "#085041",
            color: "#fff",
            fontSize: 15,
            fontWeight: 600,
            cursor: (sending || !phone.trim() || !messageToSend.trim()) ? "not-allowed" : "pointer",
            fontFamily: "inherit",
          }}
        >
          {sending ? "⏳ Sending…" : "Send WhatsApp Greeting →"}
        </button>

        <p style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", margin: 0 }}>
          Powered by AksharaTantra · Meta WhatsApp Cloud API
        </p>
      </div>
    </div>
  );
}

const card = { background: "#fff", border: "0.5px solid #e2e8f0", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10 };
const labelStyle = { fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" };