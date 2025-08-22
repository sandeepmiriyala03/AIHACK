const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, ".env.local");

const now = new Date();
const dateIST = now.toLocaleString("en-IN", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
}).replace(/\//g, "-"); // optional: replace slashes with dashes for uniform format

const content = `NEXT_PUBLIC_LAST_DEPLOYED=${dateIST}\n`;

// Write or overwrite environment variable in .env.local
fs.writeFileSync(envPath, content, "utf8");
console.log(`Set NEXT_PUBLIC_LAST_DEPLOYED to ${dateIST}`);
