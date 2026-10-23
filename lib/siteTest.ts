// lib/siteTest.ts
// "Test your website": the 59 test cases, parsers for agent-browser --json output,
// pass/fail rules, scores and Markdown export.
// Pure TypeScript (no Node or browser APIs), so the API route, the page and unit tests can all import it.
// Nothing here stores data.

/* ================================================================== */
/* Types                                                               */
/* ================================================================== */

export type Status = "pass" | "warn" | "fail" | "skip" | "error";
export type AreaKey = "LN" | "ST" | "AC" | "AI" | "SP" | "VR" | "IN" | "PR" | "SF";
export type Priority = "In module" | "P1" | "P2" | "P3";

export interface TestCase {
  id: string;
  area: AreaKey;
  title: string;
  command: string;
  passWhen: string;
}

export interface TestResult extends TestCase {
  status: Status;
  detail: string;
}

export interface StepResult {
  ok: boolean;
  data?: unknown;
  text?: string; // first part of raw stdout (for checks like content boundaries)
  error?: string;
  ms: number;
}

export interface StepLog {
  name: string;
  ok: boolean;
  ms: number;
  error?: string;
}

export interface Vitals {
  ttfb?: number;
  fcp?: number;
  lcp?: number;
  cls?: number;
  inp?: number;
}

export interface A11yIssue {
  id: string;
  impact: string;
  help: string;
  helpUrl: string;
  count: number;
  targets: string[];
  mode: "light" | "dark" | "mobile" | "wcag";
}

export interface A11yResult {
  ran: boolean;
  violations: A11yIssue[];
  passes: number;
  incomplete: number;
}

/** Facts the runner learned while testing, needed to judge some cases. */
export interface RunContext {
  url: string;
  finalUrl: string;
  isHttps: boolean;
  httpTried: boolean;
  ctaRef?: string;
  disabledCount: number;
  hasCheckbox: boolean;
  hasCombobox: boolean;
  hasSearchbox: boolean;
  sameSiteLink?: string;
  refTextBefore?: string;
}

export interface Images {
  desktop?: string;
  mobile?: string;
  dark?: string;
  full?: string;
  offline?: string;
}

export interface FullReport {
  url: string;
  finalUrl: string;
  title: string;
  testedAt: string;
  durationMs: number;
  score: number;
  counts: Record<Status, number>;
  areas: { area: AreaKey; label: string; score: number; counts: Record<Status, number> }[];
  results: TestResult[];
  vitals: { desktop: Vitals; mobile: Vitals };
  a11y: { light: A11yResult; dark: A11yResult; mobile: A11yResult; wcag: A11yResult };
  images: Images; // data: URLs, in memory only
  pdf?: string; // base64, in memory only
  steps: StepLog[];
}

/* ================================================================== */
/* The 59 test cases                                                   */
/* ================================================================== */

export const AREAS: Record<AreaKey, string> = {
  LN: "Load and navigation",
  ST: "Stability",
  AC: "Accessibility",
  AI: "AI-agent readiness",
  SP: "Speed",
  VR: "Visual and responsive",
  IN: "Interaction (safe checks)",
  PR: "Privacy",
  SF: "Runner safety",
};

export const TEST_CASES: TestCase[] = [
  // Load and navigation
  { id: "LN-01", area: "LN", title: "Page opens", command: "open <url>", passWhen: "Command succeeds" },
  { id: "LN-02", area: "LN", title: "Page finishes loading", command: "wait --load networkidle", passWhen: "Done within 25 s" },
  { id: "LN-03", area: "LN", title: "Page has a title", command: "get title", passWhen: "Title is not empty" },
  { id: "LN-04", area: "LN", title: "Redirects end on the same site", command: "get url", passWhen: "Same site, on https" },
  { id: "LN-05", area: "LN", title: "http redirects to https", command: "open http://<site>, get url", passWhen: "Final URL starts with https" },
  { id: "LN-06", area: "LN", title: "Page language is set", command: "get attr html lang", passWhen: "lang is not empty" },
  { id: "LN-07", area: "LN", title: "Meta description exists", command: "eval meta[name=description]", passWhen: "Not empty" },
  { id: "LN-08", area: "LN", title: "Reload keeps the page", command: "reload, get url", passWhen: "Same URL, no error" },
  { id: "LN-09", area: "LN", title: "Back and forward work", command: "open <same-site link>, back, forward, get url", passWhen: "Returns to each page" },
  // Stability
  { id: "ST-01", area: "ST", title: "No JavaScript errors", command: "errors", passWhen: "List is empty" },
  { id: "ST-02", area: "ST", title: "No console errors", command: "console", passWhen: "No error-level messages" },
  { id: "ST-03", area: "ST", title: "No failed requests", command: "network requests", passWhen: "No 4xx or 5xx responses" },
  { id: "ST-04", area: "ST", title: "No server errors on API calls", command: "network requests --type xhr,fetch --status 500-599", passWhen: "List is empty" },
  { id: "ST-05", area: "ST", title: "No blocking dialog", command: "dialog status", passWhen: "No dialog open" },
  { id: "ST-06", area: "ST", title: "Offline shows a friendly page", command: "set offline on, reload", passWhen: "Site shows its own offline content" },
  { id: "ST-07", area: "ST", title: "Third-party requests are few", command: "network requests", passWhen: "10 or fewer other hosts" },
  // Accessibility
  { id: "AC-01", area: "AC", title: "Accessibility audit, light mode", command: "a11y", passWhen: "0 violations" },
  { id: "AC-02", area: "AC", title: "Accessibility audit, dark mode", command: "set media dark, reload, a11y", passWhen: "0 violations" },
  { id: "AC-03", area: "AC", title: "WCAG A and AA rules", command: "a11y --tags wcag2a,wcag2aa", passWhen: "0 violations" },
  { id: "AC-04", area: "AC", title: "Accessibility on a phone screen", command: "set device \"iPhone 14\", a11y", passWhen: "0 violations" },
  { id: "AC-05", area: "AC", title: "Exactly one main heading", command: "get count h1", passWhen: "Count is 1" },
  { id: "AC-06", area: "AC", title: "Keyboard focus moves", command: "press Tab (x3), eval activeElement", passWhen: "Focus is on a control, not BODY" },
  { id: "AC-07", area: "AC", title: "Skip link is first", command: "snapshot -i", passWhen: "First control is a skip link" },
  // AI-agent readiness
  { id: "AI-01", area: "AI", title: "Agent can find controls", command: "snapshot -i", passWhen: "At least 1 button, link or input" },
  { id: "AI-02", area: "AI", title: "Every control has a name", command: "snapshot -i", passWhen: "No control without a name" },
  { id: "AI-03", area: "AI", title: "WebMCP tools exposed", command: "webmcp list", passWhen: "At least 1 tool (optional)" },
  { id: "AI-04", area: "AI", title: "llms.txt present", command: "read <url> --llms index", passWhen: "File is found" },
  { id: "AI-05", area: "AI", title: "Page text readable without JavaScript", command: "read <url>", passWhen: "Real content, not only loading text" },
  { id: "AI-06", area: "AI", title: "Links carry real URLs", command: "snapshot -i --urls", passWhen: "90% of links have an href" },
  { id: "AI-07", area: "AI", title: "Markdown version served", command: "read <url> --require-md", passWhen: "Server returns text/markdown (optional)" },
  // Speed
  { id: "SP-01", area: "SP", title: "Speed on desktop", command: "vitals <url>", passWhen: "LCP ≤ 2.5 s and CLS ≤ 0.1" },
  { id: "SP-02", area: "SP", title: "Speed on a phone", command: "set device \"iPhone 14\", vitals <url>", passWhen: "LCP ≤ 2.5 s and CLS ≤ 0.1" },
  { id: "SP-03", area: "SP", title: "Page weight", command: "network requests", passWhen: "80 requests or fewer" },
  { id: "SP-04", area: "SP", title: "React hydration (React sites)", command: "open --enable react-devtools, react tree, vitals", passWhen: "Hydration measured (skipped if not React)" },
  { id: "SP-05", area: "SP", title: "Slow-spot trace", command: "trace start, reload, trace stop", passWhen: "Trace recorded" },
  // Visual and responsive
  { id: "VR-01", area: "VR", title: "Desktop screenshot with labels", command: "screenshot --annotate", passWhen: "Image captured" },
  { id: "VR-02", area: "VR", title: "Phone screenshot", command: "set device \"iPhone 14\", screenshot --annotate", passWhen: "Image captured" },
  { id: "VR-03", area: "VR", title: "No sideways scroll on small screens", command: "set viewport 360 800, eval scrollWidth", passWhen: "Page fits 360 px" },
  { id: "VR-04", area: "VR", title: "Full-page screenshot", command: "screenshot --full", passWhen: "Image captured" },
  { id: "VR-05", area: "VR", title: "Dark mode screenshot", command: "set media dark, screenshot", passWhen: "Image captured" },
  { id: "VR-06", area: "VR", title: "Page looks the same after reload", command: "diff screenshot --baseline", passWhen: "1% or less of pixels changed" },
  { id: "VR-07", area: "VR", title: "Page structure same after reload", command: "diff snapshot", passWhen: "No elements added or removed" },
  { id: "VR-08", area: "VR", title: "Save as PDF", command: "pdf", passWhen: "PDF created" },
  // Interaction, safe versions (nothing is submitted)
  { id: "IN-01", area: "IN", title: "Main button is usable", command: "is visible, is enabled (no click)", passWhen: "First named button is visible and enabled" },
  { id: "IN-02", area: "IN", title: "Disabled controls refuse clicks", command: "click button:disabled", passWhen: "Click is refused (needs v0.39.2)" },
  { id: "IN-03", area: "IN", title: "No overlay covers the page", command: "eval fixed elements over 40% of the screen", passWhen: "No covering overlay" },
  { id: "IN-04", area: "IN", title: "Form fields have labels", command: "eval input labels (no typing)", passWhen: "Every field has a label" },
  { id: "IN-05", area: "IN", title: "Site search responds", command: "fill searchbox \"test\", press Enter", passWhen: "Results page loads (only if a search box exists)" },
  { id: "IN-06", area: "IN", title: "Checkbox and dropdown work", command: "check, is checked, uncheck / is enabled", passWhen: "State changes, then restored" },
  { id: "IN-07", area: "IN", title: "New-tab links are safe", command: "eval a[target=_blank] rel", passWhen: "All have rel=noopener or noreferrer" },
  { id: "IN-08", area: "IN", title: "Old refs are safe after reload", command: "get text <old ref> after reload", passWhen: "Same element or refused, never a different one" },
  // Privacy
  { id: "PR-01", area: "PR", title: "No tracking cookies before consent", command: "cookies (right after open)", passWhen: "No known tracking cookies" },
  { id: "PR-02", area: "PR", title: "No personal data in local storage", command: "storage local", passWhen: "No emails or tokens in plain text" },
  { id: "PR-03", area: "PR", title: "Only expected domains needed", command: "--allowed-domains <site> open <url>", passWhen: "Page opens without a blocked redirect" },
  { id: "PR-04", area: "PR", title: "No insecure files on https", command: "network requests", passWhen: "No http:// requests" },
  // Runner safety
  { id: "SF-01", area: "SF", title: "Broken safety policy blocks actions", command: "--action-policy <missing file>", passWhen: "Action is denied (needs v0.39.2)" },
  { id: "SF-02", area: "SF", title: "Downloads need approval", command: "--confirm-actions download", passWhen: "Flag accepted for the run" },
  { id: "SF-03", area: "SF", title: "Output size capped", command: "read --max-output 50000", passWhen: "Read succeeded with the cap" },
  { id: "SF-04", area: "SF", title: "Page text marked as untrusted", command: "read --content-boundaries", passWhen: "Boundary markers present" },
];

/* ================================================================== */
/* Generic helpers                                                     */
/* ================================================================== */

type Obj = Record<string, unknown>;
const MAX_TEXT = 300;
const MAX_ITEMS = 50;

export function clip(value: unknown, max = MAX_TEXT): string {
  const text = typeof value === "string" ? value : (JSON.stringify(value) ?? "");
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/** agent-browser wraps JSON output as { success, data }. */
export function unwrap(x: unknown): unknown {
  if (x && typeof x === "object" && !Array.isArray(x) && "data" in x) return (x as { data: unknown }).data;
  return x;
}

function walk(x: unknown, visit: (o: Obj) => void, depth = 0): void {
  if (depth > 8 || !x || typeof x !== "object") return;
  if (Array.isArray(x)) {
    for (const item of x) walk(item, visit, depth + 1);
    return;
  }
  visit(x as Obj);
  for (const v of Object.values(x as Obj)) walk(v, visit, depth + 1);
}

function findNumber(x: unknown, keys: string[]): number | undefined {
  const wanted = keys.map((k) => k.toLowerCase());
  let found: number | undefined;
  walk(unwrap(x), (o) => {
    if (found !== undefined) return;
    for (const [k, v] of Object.entries(o)) {
      if (!wanted.includes(k.toLowerCase())) continue;
      if (typeof v === "number" && Number.isFinite(v)) return void (found = v);
      const inner = v && typeof v === "object" ? (v as Obj).value : undefined;
      if (typeof inner === "number" && Number.isFinite(inner)) return void (found = inner);
    }
  });
  return found;
}

const SCALAR_KEYS = ["result", "value", "text", "count", "visible", "enabled", "checked", "title", "url", "attr", "open"];

/** The single useful value of a command's output (eval result, count, title, true/false…). */
export function scalar(x: unknown): unknown {
  const d = unwrap(x);
  if (d === null || typeof d !== "object") return d;
  for (const k of SCALAR_KEYS) {
    const v = (d as Obj)[k];
    if (v !== undefined && (v === null || typeof v !== "object")) return v;
  }
  for (const v of Object.values(d as Obj)) if (v === null || typeof v !== "object") return v;
  return undefined;
}

const asText = (x: unknown) => {
  const v = scalar(x);
  return v === undefined || v === null ? "" : String(v).trim();
};
const asBool = (x: unknown) => {
  const v = scalar(x);
  return v === true || v === "true";
};
/** Eval commands in the runner return JSON.stringify(...); parse that back. */
export function evalJson<T>(x: unknown): T | undefined {
  const v = scalar(x);
  if (typeof v !== "string") return typeof v === "object" ? (v as T) : undefined;
  try {
    return JSON.parse(v) as T;
  } catch {
    return undefined;
  }
}

function flatTarget(t: unknown): string {
  if (Array.isArray(t)) return t.map(flatTarget).join(" > ");
  return typeof t === "string" ? t : clip(t, 120);
}

export function baseHost(host: string): string {
  return host.toLowerCase().replace(/^www\./, "");
}

export function sameSite(a: string, b: string): boolean {
  const x = baseHost(a);
  const y = baseHost(b);
  return x === y || x.endsWith(`.${y}`) || y.endsWith(`.${x}`);
}

function hostOf(u: string): string {
  try {
    return new URL(u).hostname;
  } catch {
    return "";
  }
}

/* ================================================================== */
/* Parsers                                                             */
/* ================================================================== */

export function parseVitals(x: unknown): Vitals {
  return {
    ttfb: findNumber(x, ["ttfb"]),
    fcp: findNumber(x, ["fcp"]),
    lcp: findNumber(x, ["lcp"]),
    cls: findNumber(x, ["cls"]),
    inp: findNumber(x, ["inp"]),
  };
}

export function parseA11y(x: unknown, mode: A11yIssue["mode"]): A11yResult {
  const d = unwrap(x) as Obj | null;
  if (!d || typeof d !== "object" || !Array.isArray(d.violations)) {
    return { ran: false, violations: [], passes: 0, incomplete: 0 };
  }
  const counts = (d.counts ?? {}) as Obj;
  const count = (k: string) =>
    typeof counts[k] === "number" ? (counts[k] as number) : Array.isArray(d[k]) ? (d[k] as unknown[]).length : 0;
  const violations = (d.violations as Obj[]).slice(0, MAX_ITEMS).map((v): A11yIssue => {
    const nodes = Array.isArray(v.nodes) ? (v.nodes as Obj[]) : [];
    return {
      id: String(v.id ?? v.rule ?? "unknown"),
      impact: String(v.impact ?? "unknown"),
      help: clip(v.help ?? v.description ?? ""),
      helpUrl: typeof v.helpUrl === "string" && v.helpUrl.startsWith("https://") ? v.helpUrl : "",
      count: nodes.length || Number(v.count ?? 1),
      targets: nodes.slice(0, 5).map((n) => clip(flatTarget(n.target), 120)),
      mode,
    };
  });
  return { ran: true, violations, passes: count("passes"), incomplete: count("incomplete") };
}

const INTERACTIVE_ROLES = new Set([
  "button", "link", "textbox", "searchbox", "combobox", "checkbox", "radio",
  "switch", "tab", "menuitem", "option", "slider", "spinbutton",
]);

export interface SnapshotEntry {
  ref: string;
  role: string;
  name: string;
  url?: string;
}

/** Interactive entries from `snapshot -i`, in page order. */
export function parseSnapshot(x: unknown): SnapshotEntry[] {
  const d = unwrap(x) as Obj | null;
  const refs = d && typeof d === "object" && d.refs && typeof d.refs === "object" ? (d.refs as Record<string, Obj>) : {};
  return Object.entries(refs)
    .map(([ref, v]) => ({
      ref: `@${ref.replace(/^@/, "")}`,
      role: String(v?.role ?? ""),
      name: String(v?.name ?? "").trim(),
      url: typeof v?.url === "string" ? v.url : typeof v?.href === "string" ? (v.href as string) : undefined,
    }))
    .filter((e) => INTERACTIVE_ROLES.has(e.role))
    .sort((a, b) => Number(a.ref.slice(2)) - Number(b.ref.slice(2)));
}

export function parseTools(x: unknown): { name: string; description: string }[] {
  const seen = new Map<string, string>();
  walk(unwrap(x), (o) => {
    if (typeof o.name === "string" && typeof o.description === "string" && !seen.has(o.name)) {
      seen.set(clip(o.name, 80), clip(o.description, 200));
    }
  });
  return [...seen].slice(0, 20).map(([name, description]) => ({ name, description }));
}

export function parseMessages(x: unknown): { level: string; text: string }[] {
  const out = new Map<string, string>();
  const d = unwrap(x);
  if (Array.isArray(d)) for (const item of d) if (typeof item === "string") out.set(clip(item), "");
  walk(d, (o) => {
    const text = o.text ?? o.message ?? o.description;
    if (typeof text !== "string" || !text.trim()) return;
    out.set(clip(text), String(o.type ?? o.level ?? "").toLowerCase());
  });
  return [...out].slice(0, MAX_ITEMS).map(([text, level]) => ({ level, text }));
}

export interface RequestInfo {
  url: string;
  status?: number;
  type?: string;
}

export function parseRequests(x: unknown): RequestInfo[] {
  const out: RequestInfo[] = [];
  walk(unwrap(x), (o) => {
    if (typeof o.url !== "string" || !/^https?:\/\//.test(o.url)) return;
    const raw = typeof o.status === "number" ? o.status : Number((o.response as Obj | undefined)?.status);
    out.push({
      url: o.url,
      status: Number.isFinite(raw) ? raw : undefined,
      type: typeof o.type === "string" ? o.type : typeof o.resourceType === "string" ? (o.resourceType as string) : undefined,
    });
  });
  return out;
}

export function parseCookieNames(x: unknown): string[] {
  const names = new Set<string>();
  walk(unwrap(x), (o) => {
    if (typeof o.name === "string" && ("value" in o || "domain" in o)) names.add(o.name);
  });
  return [...names];
}

/** Keys of local storage plus a flag for values that look personal. Values are never kept. */
export function parseStorage(x: unknown): { keys: string[]; sensitiveKeys: string[] } {
  const pairs: [string, string][] = [];
  const d = unwrap(x);
  walk(d, (o) => {
    if (typeof o.key === "string") pairs.push([o.key, String(o.value ?? "")]);
  });
  if (!pairs.length && d && typeof d === "object" && !Array.isArray(d)) {
    for (const [k, v] of Object.entries(d as Obj)) if (typeof v === "string") pairs.push([k, v]);
  }
  const looksPersonal = (v: string) =>
    /[^\s@"]+@[^\s@"]+\.[a-z]{2,}/i.test(v) || /eyJ[\w-]{8,}\.[\w-]{8,}\./.test(v);
  return {
    keys: pairs.map(([k]) => clip(k, 80)).slice(0, MAX_ITEMS),
    sensitiveKeys: pairs.filter(([, v]) => looksPersonal(v)).map(([k]) => clip(k, 80)),
  };
}

/* ================================================================== */
/* Speed ratings                                                       */
/* ================================================================== */

export type Rating = "good" | "needs-work" | "poor" | "unknown";

export const METRICS: { key: keyof Vitals; label: string; good: number; poor: number }[] = [
  { key: "lcp", label: "Largest Contentful Paint", good: 2500, poor: 4000 },
  { key: "cls", label: "Cumulative Layout Shift", good: 0.1, poor: 0.25 },
  { key: "inp", label: "Interaction to Next Paint", good: 200, poor: 500 },
  { key: "fcp", label: "First Contentful Paint", good: 1800, poor: 3000 },
  { key: "ttfb", label: "Time to First Byte", good: 800, poor: 1800 },
];

export function rateMetric(key: keyof Vitals, value: number | undefined): Rating {
  const m = METRICS.find((x) => x.key === key);
  if (!m || value === undefined || !Number.isFinite(value)) return "unknown";
  if (value <= m.good) return "good";
  if (value <= m.poor) return "needs-work";
  return "poor";
}

export function formatMetric(key: keyof Vitals, value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return "–";
  if (key === "cls") return value.toFixed(2);
  return value >= 1000 ? `${(value / 1000).toFixed(2)} s` : `${Math.round(value)} ms`;
}

export function scoreColor(score: number): string {
  if (score >= 90) return "#15803d";
  if (score >= 50) return "#b45309";
  return "#b91c1c";
}

/* ================================================================== */
/* Pass / fail rules for all 59 cases                                  */
/* ================================================================== */

type Verdict = [Status, string];
const TRACKERS = /^(_ga|_gid|_gat|_gcl|__utm|_fbp|_fbc|fr$|IDE$|_hj|_clck|_clsk|MUID$|_uet|_tt_|_pin_)/;

function a11yVerdict(r: A11yResult): Verdict {
  if (!r.ran) return ["error", "The audit did not run."];
  if (!r.violations.length) return ["pass", `0 issues, ${r.passes} checks passed.`];
  const serious = r.violations.filter((v) => v.impact === "critical" || v.impact === "serious").length;
  return [serious ? "fail" : "warn", `${r.violations.length} issues, ${serious} critical or serious.`];
}

function vitalsVerdict(v: Vitals): Verdict {
  const lcp = rateMetric("lcp", v.lcp);
  const cls = rateMetric("cls", v.cls);
  if (lcp === "unknown" && cls === "unknown") return ["error", "Speed was not measured."];
  const text = `LCP ${formatMetric("lcp", v.lcp)}, CLS ${formatMetric("cls", v.cls)}.`;
  if (lcp === "poor" || cls === "poor") return ["fail", text];
  if (lcp === "good" && cls === "good") return ["pass", text];
  return ["warn", text];
}

/** Turn the raw command results into a verdict for every one of the 59 cases. */
export function evaluateAll(raw: Record<string, StepResult>, ctx: RunContext): TestResult[] {
  const ok = (k: string) => Boolean(raw[k]?.ok);
  const data = (k: string) => (raw[k]?.ok ? raw[k].data : undefined);
  const err = (k: string) => raw[k]?.error ?? "Command failed.";
  const ran = (k: string) => k in raw;

  const snapshot = parseSnapshot(data("snapshot"));
  const links = snapshot.filter((e) => e.role === "link");
  const allRequests = parseRequests(data("netAll"));
  const siteHost = hostOf(ctx.finalUrl) || hostOf(ctx.url);
  const thirdParty = [...new Set(allRequests.map((r) => hostOf(r.url)).filter((h) => h && !sameSite(h, siteHost)))];

  const rules: Record<string, () => Verdict> = {
    "LN-01": () => (ok("open") ? ["pass", "The page opened."] : ["fail", err("open")]),
    "LN-02": () => (ok("wait") ? ["pass", "Network went idle."] : ["warn", "The page kept loading for more than 25 s."]),
    "LN-03": () => {
      const t = asText(data("title"));
      return t ? ["pass", clip(t, 120)] : ["fail", "The page has no title."];
    },
    "LN-04": () => {
      const h = hostOf(ctx.finalUrl);
      if (!h) return ["error", "Final URL unknown."];
      if (!ctx.finalUrl.startsWith("https://")) return ["fail", `Ends on http: ${clip(ctx.finalUrl, 120)}`];
      return sameSite(h, hostOf(ctx.url)) ? ["pass", clip(ctx.finalUrl, 120)] : ["warn", `Redirects to another site: ${h}`];
    },
    "LN-05": () => {
      if (!ctx.httpTried) return ["skip", "Not tried."];
      if (!ok("httpOpen")) return ["warn", "The http version did not open."];
      const u = asText(data("httpUrl"));
      return u.startsWith("https://") ? ["pass", "http redirects to https."] : ["fail", `Stays on http: ${clip(u, 120)}`];
    },
    "LN-06": () => {
      const lang = asText(data("lang"));
      return lang ? ["pass", `lang="${clip(lang, 20)}"`] : ["fail", "No lang attribute on <html>."];
    },
    "LN-07": () => {
      const m = asText(data("meta"));
      return m ? ["pass", clip(m, 160)] : ["warn", "No meta description."];
    },
    "LN-08": () => {
      if (!ok("reload")) return ["fail", err("reload")];
      const u = asText(data("reloadUrl"));
      return !u || u === ctx.finalUrl ? ["pass", "Same page after reload."] : ["warn", `URL changed to ${clip(u, 120)}`];
    },
    "LN-09": () => {
      if (!ctx.sameSiteLink) return ["skip", "No other page on the same site was linked."];
      if (!ok("navBack") || !ok("navFwd")) return ["fail", err(ok("navBack") ? "navFwd" : "navBack")];
      const back = asText(data("navBackUrl"));
      const fwd = asText(data("navFwdUrl"));
      const good = back.split("#")[0] === ctx.finalUrl.split("#")[0] && fwd.split("#")[0] === ctx.sameSiteLink.split("#")[0];
      return good ? ["pass", "Back and forward returned to the right pages."] : ["fail", `Back went to ${clip(back, 80)}, forward to ${clip(fwd, 80)}.`];
    },

    "ST-01": () => {
      const e = parseMessages(data("errors"));
      if (!ok("errors")) return ["error", err("errors")];
      return e.length ? ["fail", `${e.length} error(s). First: ${e[0].text}`] : ["pass", "No JavaScript errors."];
    },
    "ST-02": () => {
      if (!ok("console")) return ["error", err("console")];
      const msgs = parseMessages(data("console"));
      const errors = msgs.filter((m) => m.level === "error" || m.level === "assert");
      const warns = msgs.filter((m) => m.level === "warning" || m.level === "warn");
      if (errors.length) return ["fail", `${errors.length} error(s). First: ${errors[0].text}`];
      if (warns.length) return ["warn", `${warns.length} warning(s). First: ${warns[0].text}`];
      return ["pass", "Console is clean."];
    },
    "ST-03": () => {
      if (!ok("netAll")) return ["error", err("netAll")];
      const failed = allRequests.filter((r) => (r.status ?? 0) >= 400);
      return failed.length
        ? ["fail", `${failed.length} failed: ${failed.slice(0, 3).map((r) => `${r.status} ${clip(r.url, 80)}`).join("; ")}`]
        : ["pass", `${allRequests.length} requests, none failed.`];
    },
    "ST-04": () => {
      if (!ok("netApi")) return ["error", err("netApi")];
      const bad = parseRequests(data("netApi")).filter((r) => (r.status ?? 0) >= 500);
      return bad.length ? ["fail", `${bad.length} API call(s) returned 5xx.`] : ["pass", "No server errors on API calls."];
    },
    "ST-05": () => {
      if (!ok("dialog")) return ["error", err("dialog")];
      const d = unwrap(data("dialog"));
      const open = asBool(d) || Boolean(d && typeof d === "object" && ((d as Obj).open === true || (d as Obj).pending === true || typeof (d as Obj).type === "string"));
      return open ? ["fail", "A dialog is blocking the page."] : ["pass", "No dialog open."];
    },
    "ST-06": () => {
      if (!ran("offText")) return ["skip", "Not tried."];
      const o = evalJson<{ len: number; url: string; err: boolean }>(data("offText"));
      if (!o) return ["error", "Could not read the offline page."];
      if (o.err || o.url.startsWith("chrome-error://")) return ["warn", "Shows the browser's default offline error (no offline support)."];
      return o.len > 30 ? ["pass", "The site shows its own content offline."] : ["fail", "Blank page when offline."];
    },
    "ST-07": () => {
      if (!ok("netAll")) return ["error", err("netAll")];
      const n = thirdParty.length;
      const list = thirdParty.slice(0, 5).join(", ");
      if (n <= 10) return ["pass", n ? `${n} other host(s): ${list}` : "No third-party requests."];
      return [n <= 25 ? "warn" : "fail", `${n} other hosts, for example ${list}`];
    },

    "AC-01": () => a11yVerdict(parseA11y(data("a11y"), "light")),
    "AC-02": () => a11yVerdict(parseA11y(data("a11yDark"), "dark")),
    "AC-03": () => a11yVerdict(parseA11y(data("a11yWcag"), "wcag")),
    "AC-04": () => a11yVerdict(parseA11y(data("a11yMobile"), "mobile")),
    "AC-05": () => {
      if (!ok("h1count")) return ["error", err("h1count")];
      const n = Number(scalar(data("h1count")));
      if (n === 1) return ["pass", "One <h1>."];
      return n === 0 ? ["fail", "No <h1> on the page."] : ["warn", `${n} <h1> elements.`];
    },
    "AC-06": () => {
      if (!ok("focus")) return ["error", err("focus")];
      const tag = asText(data("focus")).toUpperCase();
      return tag && tag !== "BODY" && tag !== "HTML" ? ["pass", `Focus reached a <${tag.toLowerCase()}>.`] : ["fail", "Tab key did not move focus to a control."];
    },
    "AC-07": () => {
      const first = snapshot[0];
      if (!first) return ["error", "No controls found."];
      return /skip/i.test(first.name) ? ["pass", `First control: "${clip(first.name, 60)}"`] : ["warn", `First control is "${clip(first.name || first.role, 60)}", not a skip link.`];
    },

    "AI-01": () => (!ok("snapshot") ? ["error", err("snapshot")] : snapshot.length ? ["pass", `${snapshot.length} controls found.`] : ["fail", "No controls an agent can use."]),
    "AI-02": () => {
      if (!ok("snapshot")) return ["error", err("snapshot")];
      const unnamed = snapshot.filter((e) => !e.name);
      return unnamed.length
        ? ["fail", `${unnamed.length} without a name: ${unnamed.slice(0, 5).map((e) => `${e.ref} ${e.role}`).join(", ")}`]
        : ["pass", "Every control has a name."];
    },
    "AI-03": () => {
      if (!ok("webmcp")) return ["warn", "No WebMCP tools (optional, new standard)."];
      const tools = parseTools(data("webmcp"));
      return tools.length ? ["pass", tools.map((t) => t.name).join(", ")] : ["warn", "No WebMCP tools (optional, new standard)."];
    },
    "AI-04": () => (ok("llms") ? ["pass", "llms.txt found."] : ["warn", "No llms.txt."]),
    "AI-05": () => {
      if (!ok("read")) return ["error", err("read")];
      const text = asText(data("read")) || raw.read.text || "";
      const clean = text.replace(/AGENT_BROWSER_PAGE_CONTENT[^\n]*/g, "").trim();
      if (clean.length < 200) return ["fail", `Only ${clean.length} characters readable without JavaScript.`];
      if (/^(loading|లోడ్)/i.test(clean) || /లోడ్ అవుతున్నాయి|loading\.\.\./i.test(clean.slice(0, 300))) {
        return ["warn", "Readable text starts with a loading message."];
      }
      return ["pass", `${clean.length} characters of real content.`];
    },
    "AI-06": () => {
      if (!links.length) return ["skip", "No links on the page."];
      if (!links.some((l) => l.url !== undefined)) return ["skip", "Link URLs were not reported."];
      const withUrl = links.filter((l) => l.url).length;
      const share = withUrl / links.length;
      return [share >= 0.9 ? "pass" : "warn", `${withUrl} of ${links.length} links have a URL.`];
    },
    "AI-07": () => (ok("readMd") ? ["pass", "Markdown served."] : ["warn", "No markdown version (optional)."]),

    "SP-01": () => vitalsVerdict(parseVitals(data("vitalsDesktop"))),
    "SP-02": () => vitalsVerdict(parseVitals(data("vitalsMobile"))),
    "SP-03": () => {
      if (!ok("netAll")) return ["error", err("netAll")];
      const n = allRequests.length;
      return [n <= 80 ? "pass" : n <= 150 ? "warn" : "fail", `${n} requests.`];
    },
    "SP-04": () => {
      if (!ran("reactTree")) return ["skip", "Not tried."];
      if (!ok("reactTree")) return ["skip", "Not a React site (or React DevTools hook unavailable)."];
      const ms = findNumber(data("reactVitals"), ["hydration", "hydrationMs", "hydrationDuration"]);
      if (!ok("reactVitals")) return ["error", err("reactVitals")];
      return ["pass", ms !== undefined ? `Hydration ${formatMetric("lcp", ms)}.` : "React detected; hydration summary recorded."];
    },
    "SP-05": () => (ok("traceStop") ? ["pass", "Trace recorded during a reload."] : ["error", err("traceStop")]),

    "VR-01": () => (ok("shotDesktop") ? ["pass", "Captured."] : ["fail", err("shotDesktop")]),
    "VR-02": () => (ok("shotMobile") ? ["pass", "Captured."] : ["fail", err("shotMobile")]),
    "VR-03": () => {
      if (!ok("scrollFit")) return ["error", err("scrollFit")];
      return asBool(data("scrollFit")) ? ["pass", "Fits a 360 px wide screen."] : ["fail", "Scrolls sideways on a 360 px screen."];
    },
    "VR-04": () => (ok("shotFull") ? ["pass", "Captured."] : ["fail", err("shotFull")]),
    "VR-05": () => (ok("shotDark") ? ["pass", "Captured."] : ["fail", err("shotDark")]),
    "VR-06": () => {
      if (!ok("diffShot")) return ["error", err("diffShot")];
      const pct = findNumber(data("diffShot"), ["mismatchPercentage", "diffPercentage", "percentage", "percent", "mismatch"]);
      if (pct === undefined) return ["pass", "Compared; no difference reported."];
      return [pct <= 1 ? "pass" : pct <= 5 ? "warn" : "fail", `${pct.toFixed(2)}% of pixels changed after reload.`];
    },
    "VR-07": () => {
      if (!ok("diffSnap")) return ["error", err("diffSnap")];
      const added = findNumber(data("diffSnap"), ["added", "additions"]) ?? 0;
      const removed = findNumber(data("diffSnap"), ["removed", "deletions"]) ?? 0;
      const changed = findNumber(data("diffSnap"), ["changed", "changes"]) ?? 0;
      const total = added + removed + changed;
      return total ? ["warn", `${added} added, ${removed} removed, ${changed} changed after reload.`] : ["pass", "Same structure after reload."];
    },
    "VR-08": () => (ok("pdf") ? ["pass", "PDF created."] : ["fail", err("pdf")]),

    "IN-01": () => {
      if (!ctx.ctaRef) return ["skip", "No named button or link found."];
      const visible = asBool(data("ctaVisible"));
      const enabled = asBool(data("ctaEnabled"));
      return visible && enabled ? ["pass", `${ctx.ctaRef} is visible and enabled.`] : ["fail", `${ctx.ctaRef} visible: ${visible}, enabled: ${enabled}.`];
    },
    "IN-02": () => {
      if (!ctx.disabledCount) return ["skip", "No disabled controls on the page."];
      return ok("disabledClick") ? ["fail", "A disabled control accepted a click."] : ["pass", "Click on a disabled control was refused."];
    },
    "IN-03": () => {
      const o = evalJson<{ overlays: string[] }>(data("overlay"));
      if (!o) return ["error", err("overlay")];
      return o.overlays.length ? ["fail", `Covering element: ${o.overlays.join(", ")}`] : ["pass", "No overlay covers the page."];
    },
    "IN-04": () => {
      const o = evalJson<{ total: number; missing: number }>(data("labels"));
      if (!o) return ["error", err("labels")];
      if (!o.total) return ["skip", "No form fields on the page."];
      return o.missing ? ["fail", `${o.missing} of ${o.total} fields have no label.`] : ["pass", `All ${o.total} fields have labels.`];
    },
    "IN-05": () => {
      if (!ctx.hasSearchbox) return ["skip", "No search box on the page."];
      if (!ok("searchEnter")) return ["fail", err("searchEnter")];
      const u = asText(data("searchUrl"));
      return u && u !== ctx.finalUrl ? ["pass", `Search opened ${clip(u, 100)}`] : ["warn", "Search ran but the address did not change (may update in place)."];
    },
    "IN-06": () => {
      if (!ctx.hasCheckbox && !ctx.hasCombobox) return ["skip", "No checkbox or dropdown on the page."];
      if (ctx.hasCheckbox) {
        return ok("chkCheck") && asBool(data("chkAfter")) ? ["pass", "Checkbox toggled and was restored."] : ["fail", "Checkbox did not change state."];
      }
      return asBool(data("comboEnabled")) ? ["pass", "Dropdown is enabled."] : ["fail", "Dropdown is disabled."];
    },
    "IN-07": () => {
      const o = evalJson<{ total: number; unsafe: number }>(data("blank"));
      if (!o) return ["error", err("blank")];
      if (!o.total) return ["skip", "No new-tab links."];
      return o.unsafe ? ["warn", `${o.unsafe} of ${o.total} new-tab links lack rel="noopener".`] : ["pass", `All ${o.total} new-tab links are safe.`];
    },
    "IN-08": () => {
      if (!ran("refAfter")) return ["skip", "No control to test."];
      if (!ok("refAfter")) return ["pass", "The old ref was refused after reload."];
      const after = asText(data("refAfter"));
      return after === (ctx.refTextBefore ?? "") ? ["pass", "The old ref still pointed at the same element."] : ["fail", "The old ref pointed at a different element."];
    },

    "PR-01": () => {
      if (!ok("cookies")) return ["error", err("cookies")];
      const names = parseCookieNames(data("cookies"));
      const trackers = names.filter((n) => TRACKERS.test(n));
      return trackers.length ? ["warn", `Tracking cookies before consent: ${trackers.slice(0, 5).join(", ")}`] : ["pass", `${names.length} cookie(s), none known for tracking.`];
    },
    "PR-02": () => {
      if (!ok("storage")) return ["error", err("storage")];
      const s = parseStorage(data("storage"));
      return s.sensitiveKeys.length
        ? ["warn", `Possible email or token in: ${s.sensitiveKeys.slice(0, 5).join(", ")}`]
        : ["pass", `${s.keys.length} key(s), nothing personal-looking.`];
    },
    "PR-03": () => {
      if (!ran("allowedOpen")) return ["skip", "Not tried."];
      if (ok("allowedOpen")) return ["pass", "The page opens with only its own domain allowed."];
      return /block|allow|domain/i.test(err("allowedOpen")) ? ["fail", `Redirect to a blocked host: ${err("allowedOpen")}`] : ["error", err("allowedOpen")];
    },
    "PR-04": () => {
      if (!ctx.finalUrl.startsWith("https://")) return ["skip", "The site itself is on http."];
      if (!ok("netAll")) return ["error", err("netAll")];
      const insecure = allRequests.filter((r) => r.url.startsWith("http://"));
      return insecure.length ? ["fail", `${insecure.length} insecure request(s), e.g. ${clip(insecure[0].url, 100)}`] : ["pass", "Everything loads over https."];
    },

    "SF-01": () => (ok("sfPolicy") ? ["warn", "A missing policy file did not block the action; check which actions policies cover."] : ["pass", "A missing policy file blocked the action."]),
    "SF-02": () => (ok("open") ? ["pass", "Downloads required approval during the run."] : ["error", "The run did not start."]),
    "SF-03": () => (ok("read") ? ["pass", "Page text was read with a 50,000-character cap."] : ["error", err("read")]),
    "SF-04": () => {
      if (!ok("read")) return ["error", err("read")];
      return /AGENT_BROWSER_PAGE_CONTENT|content.?boundar/i.test(raw.read.text ?? "") ? ["pass", "Page text was wrapped in boundary markers."] : ["warn", "No boundary markers seen in the output."];
    },
  };

  return TEST_CASES.map((tc) => {
    const rule = rules[tc.id];
    let verdict: Verdict;
    try {
      verdict = rule ? rule() : ["error", "No rule."];
    } catch {
      verdict = ["error", "Could not judge this result."];
    }
    return { ...tc, status: verdict[0], detail: verdict[1] };
  });
}

/* ================================================================== */
/* Scores and the final report                                         */
/* ================================================================== */

function countStatuses(results: TestResult[]): Record<Status, number> {
  const c: Record<Status, number> = { pass: 0, warn: 0, fail: 0, skip: 0, error: 0 };
  for (const r of results) c[r.status] += 1;
  return c;
}

/** Pass = 1, warn = 0.5, fail or error = 0; skipped cases do not count. */
function scoreOf(c: Record<Status, number>): number {
  const judged = c.pass + c.warn + c.fail + c.error;
  return judged ? Math.round(((c.pass + c.warn * 0.5) / judged) * 100) : 0;
}

export function buildFullReport(input: {
  url: string;
  ctx: RunContext;
  raw: Record<string, StepResult>;
  steps: StepLog[];
  images: Images;
  pdf?: string;
  startedAt: number;
}): FullReport {
  const { url, ctx, raw, steps, images, pdf, startedAt } = input;
  const data = (k: string) => (raw[k]?.ok ? raw[k].data : undefined);
  const results = evaluateAll(raw, ctx);
  const counts = countStatuses(results);

  return {
    url,
    finalUrl: ctx.finalUrl,
    title: clip(asText(data("title")), 200),
    testedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    score: scoreOf(counts),
    counts,
    areas: (Object.keys(AREAS) as AreaKey[]).map((area) => {
      const c = countStatuses(results.filter((r) => r.area === area));
      return { area, label: AREAS[area], score: scoreOf(c), counts: c };
    }),
    results,
    vitals: { desktop: parseVitals(data("vitalsDesktop")), mobile: parseVitals(data("vitalsMobile")) },
    a11y: {
      light: parseA11y(data("a11y"), "light"),
      dark: parseA11y(data("a11yDark"), "dark"),
      mobile: parseA11y(data("a11yMobile"), "mobile"),
      wcag: parseA11y(data("a11yWcag"), "wcag"),
    },
    images,
    pdf,
    steps,
  };
}

/* ================================================================== */
/* Markdown export (built in the visitor's browser)                    */
/* ================================================================== */

const STATUS_WORD: Record<Status, string> = { pass: "PASS", warn: "WARN", fail: "FAIL", skip: "SKIP", error: "ERROR" };

export function toMarkdown(r: FullReport): string {
  const L: string[] = [];
  const esc = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");
  L.push("# Website test report", "");
  L.push(`- **Site:** ${r.finalUrl}`);
  if (r.title) L.push(`- **Title:** ${r.title}`);
  L.push(`- **Tested:** ${new Date(r.testedAt).toLocaleString()} (${Math.round(r.durationMs / 1000)} s)`);
  L.push(`- **Score:** ${r.score}/100 · ${r.counts.pass} pass, ${r.counts.warn} warn, ${r.counts.fail} fail, ${r.counts.skip} skip, ${r.counts.error} error`);
  L.push("- **Tool:** agent-browser (Vercel Labs), via AksharaTantra", "");

  L.push("## Areas", "", "| Area | Score | Pass | Warn | Fail | Skip | Error |", "| --- | --- | --- | --- | --- | --- | --- |");
  for (const a of r.areas) L.push(`| ${a.label} | ${a.score} | ${a.counts.pass} | ${a.counts.warn} | ${a.counts.fail} | ${a.counts.skip} | ${a.counts.error} |`);
  L.push("", "_Score: pass = 1, warn = 0.5, fail or error = 0; skipped cases do not count._", "");

  L.push("## All test cases", "", "| ID | Test | Result | Detail |", "| --- | --- | --- | --- |");
  for (const t of r.results) L.push(`| ${t.id} | ${esc(t.title)} | ${STATUS_WORD[t.status]} | ${esc(t.detail)} |`);
  L.push("");

  L.push("## Speed", "", "| Metric | Desktop | Mobile |", "| --- | --- | --- |");
  for (const m of METRICS) L.push(`| ${m.key.toUpperCase()} | ${formatMetric(m.key, r.vitals.desktop[m.key])} | ${formatMetric(m.key, r.vitals.mobile[m.key])} |`);
  L.push("");

  L.push("## Accessibility issues", "");
  const issues = [...r.a11y.light.violations, ...r.a11y.dark.violations, ...r.a11y.mobile.violations, ...r.a11y.wcag.violations];
  if (!issues.length) L.push("None found by the automatic audit.");
  for (const v of issues) {
    L.push(`- **[${v.impact}] ${v.id}** (${v.mode}, ${v.count} element${v.count === 1 ? "" : "s"}): ${v.help}`);
    for (const t of v.targets) L.push(`  - \`${t}\``);
    if (v.helpUrl) L.push(`  - How to fix: ${v.helpUrl}`);
  }
  return L.join("\n");
}
