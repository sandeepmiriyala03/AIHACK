// lib/siteTest.test.ts — run with: npx vitest run lib
import { describe, expect, it } from "vitest";
import {
  AREAS,
  TEST_CASES,
  buildFullReport,
  evaluateAll,
  parseA11y,
  parseStorage,
  sameSite,
  type RunContext,
  type StepResult,
  type TestResult,
} from "./siteTest";
import { checkUrl, isPrivateIp } from "./urlSafety";

/* ---------- helpers to fake agent-browser --json output ---------- */

const ok = (data: unknown, text = ""): StepResult => ({ ok: true, ms: 1, data: { success: true, data }, text });
const bad = (error = "boom"): StepResult => ({ ok: false, ms: 1, error });
const byId = (results: TestResult[], id: string) => results.find((r) => r.id === id)!;

const baseCtx = (over: Partial<RunContext> = {}): RunContext => ({
  url: "https://example.com/",
  finalUrl: "https://example.com/",
  isHttps: true,
  httpTried: true,
  disabledCount: 0,
  hasCheckbox: false,
  hasCombobox: false,
  hasSearchbox: false,
  ...over,
});

/** A site where everything is fine. */
function goodSite(): Record<string, StepResult> {
  return {
    sfPolicy: bad("policy file missing: denied"),
    open: ok({ url: "https://example.com/" }),
    cookies: ok({ cookies: [{ name: "session", value: "x", domain: "example.com" }] }),
    wait: ok({}),
    title: ok({ title: "Example" }),
    lang: ok({ value: "te" }),
    meta: ok({ result: "A nice page" }),
    snapshot: ok({
      snapshot: "...",
      refs: {
        e1: { role: "link", name: "Skip to content", url: "https://example.com/#main" },
        e2: { role: "button", name: "Start" },
        e3: { role: "link", name: "About", url: "https://example.com/about" },
      },
    }),
    webmcp: ok({ tools: [{ name: "search", description: "Search poems" }] }),
    h1count: ok({ count: 1 }),
    errors: ok({ errors: [] }),
    console: ok({ messages: [{ type: "log", text: "hello" }] }),
    netAll: ok({ requests: [{ url: "https://example.com/app.js", status: 200 }, { url: "https://cdn.other.com/x.js", status: 200 }] }),
    netApi: ok({ requests: [] }),
    dialog: ok({ open: false }),
    storage: ok({ theme: "dark" }),
    a11y: ok({ counts: { passes: 40 }, violations: [] }),
    a11yWcag: ok({ counts: { passes: 30 }, violations: [] }),
    a11yDark: ok({ counts: { passes: 40 }, violations: [] }),
    a11yMobile: ok({ counts: { passes: 40 }, violations: [] }),
    overlay: ok({ result: JSON.stringify({ overlays: [] }) }),
    labels: ok({ result: JSON.stringify({ total: 2, missing: 0 }) }),
    blank: ok({ result: JSON.stringify({ total: 1, unsafe: 0 }) }),
    focus: ok({ result: "A" }),
    ctaVisible: ok({ visible: true }),
    ctaEnabled: ok({ enabled: true }),
    shotDesktop: ok({}),
    shotFull: ok({}),
    pdf: ok({}),
    reload: ok({}),
    reloadUrl: ok({ url: "https://example.com/" }),
    refAfter: ok({ text: "Start" }),
    diffSnap: ok({ added: 0, removed: 0, changed: 0 }),
    diffShot: ok({ mismatchPercentage: 0.2 }),
    vitalsDesktop: ok({ ttfb: 80, fcp: 800, lcp: { value: 1200 }, cls: 0.02 }),
    traceStop: ok({}),
    navBack: ok({}),
    navBackUrl: ok({ url: "https://example.com/" }),
    navFwd: ok({}),
    navFwdUrl: ok({ url: "https://example.com/about" }),
    shotDark: ok({}),
    shotMobile: ok({}),
    vitalsMobile: ok({ metrics: { LCP: 2000, CLS: 0.05 } }),
    scrollFit: ok({ result: true }),
    offText: ok({ result: JSON.stringify({ len: 500, url: "https://example.com/", err: false }) }),
    httpOpen: ok({}),
    httpUrl: ok({ url: "https://example.com/" }),
    read: ok({ text: "Real content ".repeat(40) }, "--- AGENT_BROWSER_PAGE_CONTENT nonce=1 ---"),
    llms: ok({}),
    readMd: bad("not markdown"),
    reactTree: bad("React DevTools hook not installed"),
    allowedOpen: ok({}),
  };
}

/* ---------- catalog ---------- */

describe("test catalog", () => {
  it("has exactly 59 unique cases", () => {
    expect(TEST_CASES).toHaveLength(59);
    expect(new Set(TEST_CASES.map((t) => t.id)).size).toBe(59);
  });

  it("matches the per-area counts in the test-case document", () => {
    const counts = Object.fromEntries(Object.keys(AREAS).map((a) => [a, TEST_CASES.filter((t) => t.area === a).length]));
    expect(counts).toEqual({ LN: 9, ST: 7, AC: 7, AI: 7, SP: 5, VR: 8, IN: 8, PR: 4, SF: 4 });
  });
});

/* ---------- verdicts ---------- */

describe("evaluateAll on a healthy site", () => {
  const results = evaluateAll(goodSite(), baseCtx({ ctaRef: "@e2", refTextBefore: "Start", sameSiteLink: "https://example.com/about" }));

  it("returns a verdict for all 59 cases", () => {
    expect(results).toHaveLength(59);
    for (const r of results) expect(["pass", "warn", "fail", "skip", "error"]).toContain(r.status);
  });

  it.each([
    "LN-01", "LN-03", "LN-04", "LN-05", "LN-06", "LN-07", "LN-08", "LN-09",
    "ST-01", "ST-02", "ST-03", "ST-04", "ST-05", "ST-06", "ST-07",
    "AC-01", "AC-02", "AC-03", "AC-04", "AC-05", "AC-06", "AC-07",
    "AI-01", "AI-02", "AI-03", "AI-04", "AI-05", "AI-06",
    "SP-01", "SP-02", "SP-03", "SP-05",
    "VR-01", "VR-02", "VR-03", "VR-04", "VR-05", "VR-06", "VR-07", "VR-08",
    "IN-01", "IN-03", "IN-04", "IN-07", "IN-08",
    "PR-01", "PR-02", "PR-03", "PR-04",
    "SF-01", "SF-02", "SF-03", "SF-04",
  ])("%s passes", (id) => {
    const r = byId(results, id);
    expect(r.status, `${id}: ${r.detail}`).toBe("pass");
  });

  it("skips cases that do not apply", () => {
    expect(byId(results, "IN-02").status).toBe("skip"); // no disabled controls
    expect(byId(results, "IN-05").status).toBe("skip"); // no search box
    expect(byId(results, "IN-06").status).toBe("skip"); // no checkbox or dropdown
    expect(byId(results, "SP-04").status).toBe("skip"); // not React
  });

  it("only warns for optional extras", () => {
    expect(byId(results, "AI-07").status).toBe("warn"); // no markdown version
  });
});

describe("evaluateAll on a site with problems", () => {
  const raw = goodSite();
  raw.title = ok({ title: "" });
  raw.lang = ok({ value: "" });
  raw.h1count = ok({ count: 0 });
  raw.errors = ok({ errors: [{ message: "TypeError: x is undefined" }] });
  raw.console = ok({ messages: [{ type: "error", text: "Failed to load font" }] });
  raw.netAll = ok({ requests: [{ url: "http://example.com/old.png", status: 404 }] });
  raw.a11y = ok({ counts: { passes: 20 }, violations: [{ id: "color-contrast", impact: "serious", help: "Low contrast", helpUrl: "https://dequeuniversity.com/x", nodes: [{ target: [".label"] }] }] });
  raw.a11yDark = ok({ counts: { passes: 20 }, violations: [{ id: "region", impact: "moderate", help: "Landmarks", nodes: [] }] });
  raw.snapshot = ok({ refs: { e1: { role: "button", name: "" }, e2: { role: "link", name: "Home" } } });
  raw.overlay = ok({ result: JSON.stringify({ overlays: ["div#cookie-wall"] }) });
  raw.labels = ok({ result: JSON.stringify({ total: 3, missing: 2 }) });
  raw.blank = ok({ result: JSON.stringify({ total: 4, unsafe: 1 }) });
  raw.focus = ok({ result: "BODY" });
  raw.scrollFit = ok({ result: false });
  raw.vitalsDesktop = ok({ lcp: 5000, cls: 0.84 });
  raw.offText = ok({ result: JSON.stringify({ len: 300, url: "chrome-error://chromewebdata/", err: true }) });
  raw.cookies = ok({ cookies: [{ name: "_ga", value: "1", domain: "example.com" }] });
  raw.storage = ok([{ key: "user", value: "me@example.com" }]);
  raw.disabledClick = ok({}); // a disabled control accepted the click
  raw.refAfter = ok({ text: "Something else" });
  raw.read = ok({ text: "Loading..." });
  raw.httpUrl = ok({ url: "http://example.com/" });
  const results = evaluateAll(raw, baseCtx({ ctaRef: "@e2", refTextBefore: "Home", disabledCount: 1, finalUrl: "https://example.com/" }));

  it.each([
    ["LN-03", "fail"], ["LN-05", "fail"], ["LN-06", "fail"],
    ["ST-01", "fail"], ["ST-02", "fail"], ["ST-03", "fail"], ["ST-06", "warn"],
    ["AC-01", "fail"], ["AC-02", "warn"], ["AC-05", "fail"], ["AC-06", "fail"],
    ["AI-02", "fail"], ["AI-05", "fail"],
    ["SP-01", "fail"],
    ["VR-03", "fail"],
    ["IN-02", "fail"], ["IN-03", "fail"], ["IN-04", "fail"], ["IN-07", "warn"], ["IN-08", "fail"],
    ["PR-01", "warn"], ["PR-02", "warn"], ["PR-04", "fail"],
  ])("%s is %s", (id, expected) => {
    const r = byId(results, id);
    expect(r.status, `${id}: ${r.detail}`).toBe(expected);
  });
});

describe("evaluateAll when nothing ran", () => {
  it("does not throw and fails the open case", () => {
    const results = evaluateAll({ open: bad("net::ERR_NAME_NOT_RESOLVED") }, baseCtx({ httpTried: false }));
    expect(results).toHaveLength(59);
    expect(byId(results, "LN-01").status).toBe("fail");
    expect(results.filter((r) => r.status === "pass").length).toBeLessThan(5);
  });
});

/* ---------- report and scores ---------- */

describe("buildFullReport", () => {
  it("scores pass as 1, warn as 0.5 and ignores skips", () => {
    const report = buildFullReport({
      url: "https://example.com/",
      ctx: baseCtx({ ctaRef: "@e2", refTextBefore: "Start", sameSiteLink: "https://example.com/about" }),
      raw: goodSite(),
      steps: [],
      images: {},
      startedAt: Date.now(),
    });
    const { pass, warn, fail, error } = report.counts;
    expect(report.score).toBe(Math.round(((pass + warn * 0.5) / (pass + warn + fail + error)) * 100));
    expect(report.areas).toHaveLength(9);
    expect(report.title).toBe("Example");
  });
});

/* ---------- parsers ---------- */

describe("parsers", () => {
  it("drops unsafe fix links and flattens shadow DOM targets", () => {
    const r = parseA11y({ violations: [{ id: "x", impact: "minor", helpUrl: "javascript:alert(1)", nodes: [{ target: [[".host", ".inner"]] }] }] }, "light");
    expect(r.violations[0].helpUrl).toBe("");
    expect(r.violations[0].targets[0]).toBe(".host > .inner");
  });

  it("flags personal-looking storage without returning values", () => {
    const s = parseStorage([{ key: "user", value: "a@b.com" }, { key: "jwt", value: "eyJhbGciOiJIUzI1.eyJzdWIiOiIxMjM0.sig" }, { key: "theme", value: "dark" }]);
    expect(s.sensitiveKeys).toEqual(["user", "jwt"]);
    expect(JSON.stringify(s)).not.toContain("a@b.com");
  });

  it("treats www and subdomains as the same site", () => {
    expect(sameSite("www.example.com", "example.com")).toBe(true);
    expect(sameSite("cdn.example.com", "example.com")).toBe(true);
    expect(sameSite("example.org", "example.com")).toBe(false);
  });
});

/* ---------- URL safety (SSRF) ---------- */

describe("URL safety", () => {
  it.each(["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fd00::1", "fe80::1", "::ffff:127.0.0.1"])(
    "blocks private address %s",
    (ip) => expect(isPrivateIp(ip)).toBe(true),
  );

  it.each(["8.8.8.8", "76.76.21.21", "2606:4700::1111"])("allows public address %s", (ip) => expect(isPrivateIp(ip)).toBe(false));

  const noDns = async () => {
    throw new Error("DNS should not be called");
  };

  it.each([
    ["http://localhost:3000", "Only standard web ports"],
    ["http://localhost", "Local and internal"],
    ["https://printer.local", "Local and internal"],
    ["http://169.254.169.254/latest/meta-data", "Only public websites"],
    ["http://[::1]/", "Only public websites"],
    ["ftp://example.com", "Only http and https"],
    ["javascript:alert(1)", "Only http and https"],
    ["file:///etc/passwd", "Only http and https"],
    ["localhost:3000", "Only standard web ports"],
    ["https://user:pass@example.com", "username or password"],
    ["", "Please enter"],
  ])("rejects %s", async (input, message) => {
    const r = await checkUrl(input, noDns as never);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain(message);
  });

  it("rejects a public name that resolves to a private address", async () => {
    const fakeDns = async () => [{ address: "10.0.0.5", family: 4 }];
    const r = await checkUrl("https://sneaky.example.com", fakeDns as never);
    expect(r.ok).toBe(false);
  });

  it("accepts a public site and adds https", async () => {
    const fakeDns = async () => [{ address: "76.76.21.21", family: 4 }];
    const r = await checkUrl("example.com", fakeDns as never);
    expect(r).toEqual({ ok: true, url: "https://example.com/" });
  });
});
