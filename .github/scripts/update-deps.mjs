// Daily dependency update (npm). Run by .github/workflows/auto-update.yml.
//
// - Security fixes (npm audit): installed immediately.
// - Normal updates: only versions published at least COOLDOWN_DAYS ago, to stay clear of
//   freshly hijacked packages (supply-chain attacks are usually caught within a day or two).
// - Never jumps a major version (15.x stays 15.x). New majors are only reported.
// - Keeps your pinning style: exact "15.1.0" stays exact, "^15.1.0" stays a range.
// Writes a summary to update-summary.json for the workflow.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const COOLDOWN_DAYS = Number(process.env.COOLDOWN_DAYS ?? 2);
const before = new Date(Date.now() - COOLDOWN_DAYS * 86_400_000).toISOString();

const npm = (args, { quiet = false } = {}) =>
  execFileSync("npm", args, { encoding: "utf8", stdio: quiet ? ["ignore", "pipe", "ignore"] : ["ignore", "pipe", "inherit"], shell: process.platform === "win32" });

const readPkg = () => JSON.parse(readFileSync("package.json", "utf8"));

// "^15.1.0" → { exact: false, version: "15.1.0" }; "15.1.0" → exact; git/file/tags → null
function parse(spec) {
  const m = /^([\^~]?)(\d+)\.(\d+)\.(\d+)(-[\w.]+)?$/.exec(spec.trim());
  if (!m) return null;
  return { exact: m[1] === "", major: Number(m[2]), minor: Number(m[3]), version: `${m[2]}.${m[3]}.${m[4]}${m[5] ?? ""}` };
}
// Same "compatible" line: ^15.1.0 allows 15.x; for 0.x, ^0.4.1 allows 0.4.x only.
const sameLine = (p) => `^${p.version}`;

function vulnerableDirectDeps() {
  try {
    npm(["audit", "--json"], { quiet: true });
    return new Set();
  } catch (e) {
    // npm audit exits non-zero when it finds something; the JSON is still on stdout.
    try {
      const report = JSON.parse(e.stdout);
      return new Set(Object.values(report.vulnerabilities ?? {}).filter((v) => v.isDirect).map((v) => v.name));
    } catch {
      return new Set();
    }
  }
}

const pkg = readPkg();
const urgent = vulnerableDirectDeps();
const groups = new Map(); // key: "dev|exact|urgent" → ["name@range"]
const majors = [];
const skipped = [];

for (const [section, dev] of [["dependencies", false], ["devDependencies", true]]) {
  for (const [name, spec] of Object.entries(pkg[section] ?? {})) {
    const p = parse(spec);
    if (!p) {
      skipped.push(`${name}@${spec}`);
      continue;
    }
    const key = `${dev}|${p.exact}|${urgent.has(name)}`;
    groups.set(key, [...(groups.get(key) ?? []), `${name}@${sameLine(p)}`]);

    try {
      const latest = npm(["view", name, "version"], { quiet: true }).trim();
      const lp = parse(latest);
      if (lp && (lp.major > p.major || (p.major === 0 && lp.major === 0 && lp.minor > p.minor))) majors.push({ name, current: p.version, latest });
    } catch {
      /* private or unpublished package: ignore */
    }
  }
}

for (const [key, specs] of groups) {
  const [dev, exact, isUrgent] = key.split("|").map((x) => x === "true");
  const args = ["install", ...specs, dev ? "--save-dev" : "--save-prod", "--no-fund", "--no-audit"];
  if (exact) args.push("--save-exact");
  if (!isUrgent) args.push(`--before=${before}`);
  console.log(`npm ${args.join(" ")}`);
  try {
    npm(args);
  } catch {
    // Usually one package has no version old enough yet (you updated it by hand recently).
    // Retry one by one and leave the ones that fail as they are.
    for (const spec of specs) {
      try {
        npm(args.filter((a) => !specs.includes(a)).toSpliced(1, 0, spec));
      } catch {
        skipped.push(`${spec} (no version old enough yet)`);
      }
    }
  }
}

// Anything still flagged that stays inside the allowed ranges.
try {
  npm(["audit", "fix", "--no-fund"]);
} catch {
  /* remaining issues need a major upgrade: reported below */
}

const after = readPkg();
const changed = [];
for (const section of ["dependencies", "devDependencies"]) {
  for (const [name, spec] of Object.entries(after[section] ?? {})) {
    const old = pkg[section]?.[name];
    if (old && old !== spec) changed.push(`${name}: ${old} → ${spec}`);
  }
}

const summary = { cooldownDays: COOLDOWN_DAYS, urgent: [...urgent], changed, majors, skipped };
writeFileSync("update-summary.json", JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
