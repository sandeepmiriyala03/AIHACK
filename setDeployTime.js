const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, ".env.local");
const date = new Date().toISOString();

const content = `NEXT_PUBLIC_LAST_DEPLOYED=${date}\n`;

// Write or overwrite environment variable in .env.local
fs.writeFileSync(envPath, content, "utf8");
console.log(`Set NEXT_PUBLIC_LAST_DEPLOYED to ${date}`);
