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
    <div className="is-042369a">
      <div className="is-caa7971">

        {/* Header */}
        <div className="is-cdd8ca0">
          <div className="is-acc6ee9">📱</div>
          <h1 className="is-518767b">AksharaTantra Greetings</h1>
          <p className="is-ebefd94">Send a WhatsApp greeting instantly</p>
        </div>

        {/* Phone input */}
        <div className="is-97cd2ec">
          <label className="is-0e85094">📞 WhatsApp Number</label>
          <div className="is-b131259">
            <span className="is-421d327">+91</span>
            <input
              type="tel"
              placeholder="98765 43210"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              maxLength={15}
              className="is-a22a0e0"
            />
          </div>
          <p className="is-c37b892">Enter number with country code — e.g. 919876543210</p>
        </div>

        {/* Greeting picker */}
        <div className="is-97cd2ec">
          <label className="is-0e85094">💬 Pick a Greeting</label>
          <div className="is-d7bb5fd">
            {GREETINGS.map(g => (
              <div
                key={g.id}
                onClick={() => setSelected(g.id)}
                className="is-53e2e07" style={{ border: selected === g.id ? "1.5px solid #1D9E75" : "0.5px solid #e2e8f0", background: selected === g.id ? "#f0fdf9" : "#fff", cursor: "pointer", display: "flex", flexDirection: "column", gap: 3 }}
              >
                <span className="is-6ab5912">{g.label}</span>
                <span className="is-d5dc823">{g.text}</span>
              </div>
            ))}

            {/* Custom option */}
            <div
              onClick={() => setSelected("custom")}
              className="is-53e2e07" style={{ border: selected === "custom" ? "1.5px solid #1D9E75" : "0.5px solid #e2e8f0", background: selected === "custom" ? "#f0fdf9" : "#fff", cursor: "pointer" }}
            >
              <span className="is-6ab5912">✏️ Custom Message</span>
              {selected === "custom" && (
                <textarea
                  rows={3}
                  placeholder="Type your message here…"
                  value={custom}
                  onChange={e => { e.stopPropagation(); setCustom(e.target.value); }}
                  onClick={e => e.stopPropagation()}
                  maxLength={300}
                  className="is-692e76d"
                />
              )}
            </div>
          </div>
        </div>

        {/* Result messages */}
        {result === "success" && (
          <div className="is-b8532fa">
            ✅ Message sent successfully on WhatsApp!
          </div>
        )}
        {result === "error" && (
          <div className="is-4d582f5">
            ❌ {errMsg}
          </div>
        )}

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={sending || !phone.trim() || !messageToSend.trim()}
          className="is-41c1688" style={{ background: (sending || !phone.trim() || !messageToSend.trim()) ? "#94a3b8" : "#085041", color: "#fff", fontSize: 15, fontWeight: 600, cursor: (sending || !phone.trim() || !messageToSend.trim()) ? "not-allowed" : "pointer", fontFamily: "inherit" }}
        >
          {sending ? "⏳ Sending…" : "Send WhatsApp Greeting →"}
        </button>

        <p className="is-a274948">
          Powered by AksharaTantra · Meta WhatsApp Cloud API
        </p>
      </div>
    </div>
  );
}