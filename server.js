const express = require("express");
const http    = require("http");
const { WebSocketServer } = require("ws");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode  = require("qrcode");
const cron    = require("node-cron");
const cors    = require("cors");

const PORT = 4000;
const app    = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const wss = new WebSocketServer({ server });

function broadcast(event, data) {
  const msg = JSON.stringify({ event, data });
  wss.clients.forEach(c => { if (c.readyState === 1) c.send(msg); });
}

let waStatus = "disconnected";
let waClient = null;
let cronJob  = null;

function createClient() {
  if (waClient) { try { waClient.destroy(); } catch (_) {} }

  waClient = new Client({
    authStrategy: new LocalAuth({ dataPath: "./.wa-session" }),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage","--disable-gpu"],
    },
  });

  waClient.on("qr", async (qr) => {
    waStatus = "qr_ready";
    const qrDataUrl = await qrcode.toDataURL(qr, { width: 280, margin: 2 });
    broadcast("qr",     { qrDataUrl });
    broadcast("status", { status: "qr_ready" });
    broadcast("log",    { message: "QR ready — scan with WhatsApp.", type: "info" });
  });

  waClient.on("authenticated", () => {
    waStatus = "authenticated";
    broadcast("status", { status: "authenticated" });
    broadcast("log",    { message: "Authenticated! Loading contacts…", type: "success" });
  });

  waClient.on("ready", async () => {
    waStatus = "ready";
    broadcast("status", { status: "ready" });
    broadcast("log",    { message: "WhatsApp ready. Fetching contacts…", type: "success" });
    const contacts = await getContacts();
    broadcast("contacts", { contacts });
    broadcast("log", { message: `Loaded ${contacts.length} chats.`, type: "info" });
  });

  waClient.on("auth_failure", () => {
    waStatus = "disconnected";
    broadcast("status", { status: "disconnected" });
    broadcast("log",    { message: "Auth failed. Try again.", type: "warn" });
  });

  waClient.on("disconnected", () => {
    waStatus = "disconnected";
    broadcast("status", { status: "disconnected" });
  });

  waClient.initialize();
  broadcast("log", { message: "Initializing WhatsApp…", type: "muted" });
}

async function getContacts() {
  const chats = await waClient.getChats();
  return chats
    .filter(c => c.name && c.id.server !== "broadcast")
    .map(c => ({
      id:          c.id._serialized,
      name:        c.name,
      isGroup:     c.isGroup,
      phone:       c.isGroup ? null : c.id.user,
      memberCount: c.isGroup ? (c.participants?.length ?? 0) : null,
    }))
    .sort((a, b) => {
      if (a.isGroup !== b.isGroup) return a.isGroup ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

app.post("/api/wa/start", (req, res) => {
  if (waStatus === "ready") return res.json({ ok: true });
  createClient();
  res.json({ ok: true });
});

app.get("/api/wa/status", (req, res) => res.json({ status: waStatus }));

app.post("/api/wa/broadcast", async (req, res) => {
  if (waStatus !== "ready") return res.status(400).json({ error: "Not ready" });
  const { message, recipientIds, delayMs = 3000 } = req.body;
  res.json({ ok: true });

  let sent = 0, failed = 0;
  broadcast("log", { message: `Sending to ${recipientIds.length} contacts…`, type: "info" });

  for (const id of recipientIds) {
    try {
      const chat = await waClient.getChatById(id);
      await chat.sendMessage(message);
      sent++;
      broadcast("sent", { chatId: id });
      broadcast("log",  { message: `✓ Sent to ${id.split("@")[0]}`, type: "success" });
    } catch (e) {
      failed++;
      broadcast("log", { message: `✗ Failed: ${id.split("@")[0]}`, type: "warn" });
    }
    if (sent + failed < recipientIds.length) await sleep(delayMs);
  }

  broadcast("broadcast_done", { sent, failed });
  broadcast("log", { message: `Done — ${sent} sent, ${failed} failed.`, type: "success" });
});

app.post("/api/wa/schedule", (req, res) => {
  const { time, message, recipientIds } = req.body;
  const [hour, minute] = time.split(":").map(Number);
  if (cronJob) cronJob.stop();
  cronJob = cron.schedule(`${minute} ${hour} * * *`, async () => {
    if (waStatus !== "ready") return;
    for (const id of recipientIds) {
      try { const chat = await waClient.getChatById(id); await chat.sendMessage(message); } catch (_) {}
      await sleep(3000);
    }
    broadcast("log", { message: `Scheduled broadcast sent at ${time}.`, type: "success" });
  }, { timezone: "Asia/Kolkata" });

  broadcast("log", { message: `Cron saved: ${time} IST daily.`, type: "info" });
  res.json({ ok: true });
});

app.post("/api/wa/disconnect", async (req, res) => {
  if (cronJob) { cronJob.stop(); cronJob = null; }
  if (waClient) { try { await waClient.logout(); } catch (_) {} try { await waClient.destroy(); } catch (_) {} waClient = null; }
  waStatus = "disconnected";
  broadcast("status", { status: "disconnected" });
  res.json({ ok: true });
});

server.listen(PORT, () => {
  console.log(`✅ WhatsApp server running → http://localhost:${PORT}`);
  console.log(`   WebSocket → ws://localhost:${PORT}`);
});