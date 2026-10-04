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

const key = "NEXT_PUBLIC_LAST_DEPLOYED";
const existingContent = fs.existsSync(envPath)
  ? fs.readFileSync(envPath, "utf8")
  : "";
const newline = existingContent.includes("\r\n") ? "\r\n" : "\n";
const lines = existingContent.split(/\r?\n/);
const settingLine = `${key}=${dateIST}`;
const settingIndex = lines.findIndex((line) => line.startsWith(`${key}=`));

if (settingIndex === -1) {
  if (lines.length === 1 && lines[0] === "") {
    lines[0] = settingLine;
  } else {
    lines.push(settingLine);
  }
} else {
  lines[settingIndex] = settingLine;
}

fs.writeFileSync(envPath, lines.join(newline), "utf8");
console.log(`Set NEXT_PUBLIC_LAST_DEPLOYED to ${dateIST}`);
