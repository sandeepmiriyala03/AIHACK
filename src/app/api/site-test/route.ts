// app/api/site-test/route.ts
// POST { url, consent } -> runs all 59 test cases with agent-browser inside a throwaway
// Vercel Sandbox and returns one report.
//
// Privacy: nothing is saved. No database, no file storage, the URL is never logged.
// Screenshots and the PDF travel back in this one response and exist nowhere else;
// the sandbox (browser, files, cookies) is destroyed when the run ends.
//
// Safety: on the visitor's site the runner never clicks a normal button, never submits
// a form and never downloads. Interaction cases use safe checks (see lib/siteTest.ts).

import { NextRequest, NextResponse } from "next/server";
import { runAgentBrowserCommand, withAgentBrowserSandbox } from "@agent-browser/sandbox/vercel";
import {
  baseHost,
  buildFullReport,
  clip,
  evalJson,
  parseSnapshot,
  sameSite,
  scalar,
  TIME_LIMIT,
  type Images,
  type RunContext,
  type StepLog,
  type StepResult,
} from "@/lib/siteTest";
import { checkUrl } from "@/lib/urlSafety";
import { readSandboxFile } from "@/lib/sandboxFiles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Vercel Hobby allows at most 300 s. All 59 cases run about 90 commands; whatever does not
// fit in the time budget below is reported as "Skip: not run (time limit)" instead of failing.
// On a Pro plan you can raise this (and SITE_TEST_BUDGET_MS) so every case runs.
export const maxDuration = 300;

// Stop starting new commands this long after the request began (sandbox boot included),
// leaving time to build and send the report before maxDuration ends.
const BUDGET_MS = Number(process.env.SITE_TEST_BUDGET_MS ?? 260_000);

const NO_STORE = { "Cache-Control": "no-store" };
const AGENT_BROWSER_VERSION = process.env.AGENT_BROWSER_VERSION ?? "0.39.2";
const IMG_MAX_BYTES = 350_000; // per screenshot, keeps the response under Vercel's limit
const PDF_MAX_BYTES = 800_000;
const SHOT = ["--screenshot-format", "jpeg", "--screenshot-quality", "50"];

/* ------------------------------------------------------------------ */
/* Small page scripts for eval (read-only; they change nothing)        */
/* ------------------------------------------------------------------ */

const JS = {
  meta: `document.querySelector('meta[name="description"]')?.content || ""`,
  focus: `(document.activeElement && document.activeElement.tagName) || ""`,
  overlay: `JSON.stringify((() => { const vw = innerWidth, vh = innerHeight; const hits = [...document.querySelectorAll('body *')].filter(e => { const s = getComputedStyle(e); if (s.position !== 'fixed') return false; if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity < 0.1) return false; const r = e.getBoundingClientRect(); return r.width * r.height > vw * vh * 0.4; }); return { overlays: hits.slice(0, 3).map(e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '')) }; })())`,
  labels: `JSON.stringify((() => { const f = [...document.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]):not([type=image]), select, textarea')]; const missing = f.filter(e => !((e.labels && e.labels.length) || e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || e.title)).length; return { total: f.length, missing }; })())`,
  blank: `JSON.stringify((() => { const a = [...document.querySelectorAll('a[target="_blank"]')]; const unsafe = a.filter(e => !/noopener|noreferrer/i.test(e.rel || '')).length; return { total: a.length, unsafe }; })())`,
  disabled: `document.querySelectorAll('button:disabled, input:disabled, [aria-disabled="true"]').length`,
  scrollFit: `document.documentElement.scrollWidth <= window.innerWidth + 1`,
  offline: `JSON.stringify({ len: ((document.body && document.body.innerText) || '').trim().length, url: location.href, err: /ERR_INTERNET_DISCONNECTED/.test((document.body && document.body.innerText) || '') })`,
};

/* ------------------------------------------------------------------ */
/* Runner                                                              */
/* ------------------------------------------------------------------ */

function parseOutput(stdout: string): unknown {
  const text = (stdout ?? "").trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    for (const line of text.split(/\r?\n/).reverse()) {
      const s = line.trim();
      if (s.startsWith("{") || s.startsWith("[")) {
        try {
          return JSON.parse(s);
        } catch {
          /* keep looking */
        }
      }
    }
    return text;
  }
}

type Sandbox = Parameters<typeof runAgentBrowserCommand>[0];

async function runAllCases(sandbox: Sandbox, url: string, deadline: number) {
  const raw: Record<string, StepResult> = {};
  const steps: StepLog[] = [];
  const images: Images = {};
  let pdf: string | undefined;
  const ctx: RunContext = {
    url,
    finalUrl: url,
    isHttps: url.startsWith("https://"),
    httpTried: false,
    disabledCount: 0,
    hasCheckbox: false,
    hasCombobox: false,
    hasSearchbox: false,
  };

  const run = async (key: string, label: string, args: string[]) => {
    const t0 = Date.now();
    let r: StepResult;
    if (t0 > deadline) {
      // out of time: record it so the report shows "not run" instead of a failure
      r = { ok: false, ms: 0, error: TIME_LIMIT };
      raw[key] = r;
      steps.push({ name: label, ok: false, ms: 0, error: TIME_LIMIT });
      return r;
    }
    try {
      const res = await runAgentBrowserCommand(sandbox, [...args, "--json"], { json: false });
      const data = parseOutput(res.stdout);
      const failed = Boolean(data && typeof data === "object" && (data as { success?: boolean }).success === false);
      r = {
        ok: !failed,
        data,
        text: clip(res.stdout ?? "", 4000),
        ms: Date.now() - t0,
        error: failed ? clip((data as { error?: unknown }).error ?? "Command failed.", 200) : undefined,
      };
    } catch (e) {
      r = { ok: false, ms: Date.now() - t0, error: clip(e instanceof Error ? e.message : "Command failed.", 200) };
    }
    raw[key] = r;
    steps.push({ name: label, ok: r.ok, ms: r.ms, error: r.error });
    return r;
  };
  const value = (key: string) => (raw[key]?.ok ? scalar(raw[key].data) : undefined);
  const image = async (path: string) => {
    const r = await readSandboxFile(sandbox, path, IMG_MAX_BYTES, "jpeg");
    return r.b64 ? `data:image/${r.kind};base64,${r.b64}` : undefined;
  };

  // SF-01: a missing policy file must block actions (fail closed)
  await run("sfPolicy", "SF-01 missing policy file", ["--action-policy", "/tmp/no-such-policy.json", "open", "about:blank"]);
  await run("sfClose", "Close", ["close"]);

  // ---- Desktop session (SF-02: downloads need approval for the whole run) ----
  const opened = await run("open", "LN-01 open", ["--confirm-actions", "download", "open", url]);
  if (!opened.ok) return { raw, steps, images, pdf, ctx };
  await run("cookies", "PR-01 cookies before consent", ["cookies"]);
  await run("wait", "LN-02 wait for load", ["wait", "--load", "networkidle"]);
  await run("title", "LN-03 title", ["get", "title"]);
  await run("url", "LN-04 final URL", ["get", "url"]);
  ctx.finalUrl = String(value("url") || url);
  await run("lang", "LN-06 lang", ["get", "attr", "html", "lang"]);
  await run("meta", "LN-07 meta description", ["eval", JS.meta]);
  await run("snapshot", "AI-01/02/06, AC-07 snapshot", ["snapshot", "-i", "--urls"]);
  await run("webmcp", "AI-03 WebMCP tools", ["webmcp", "list"]);
  await run("h1count", "AC-05 h1 count", ["get", "count", "h1"]);
  await run("errors", "ST-01 page errors", ["errors"]);
  await run("console", "ST-02 console", ["console"]);
  await run("netAll", "ST-03/07, SP-03, PR-04 requests", ["network", "requests"]);
  await run("netApi", "ST-04 API errors", ["network", "requests", "--type", "xhr,fetch", "--status", "500-599"]);
  await run("dialog", "ST-05 dialog", ["dialog", "status"]);
  await run("storage", "PR-02 local storage", ["storage", "local"]);
  await run("a11y", "AC-01 accessibility (light)", ["a11y"]);
  await run("a11yWcag", "AC-03 WCAG A/AA", ["a11y", "--tags", "wcag2a,wcag2aa"]);
  await run("overlay", "IN-03 overlays", ["eval", JS.overlay]);
  await run("labels", "IN-04 field labels", ["eval", JS.labels]);
  await run("blank", "IN-07 new-tab links", ["eval", JS.blank]);

  // Facts from the snapshot
  const entries = parseSnapshot(raw.snapshot?.data);
  const cta = entries.find((e) => e.role === "button" && e.name) ?? entries.find((e) => e.role === "link" && e.name);
  const checkbox = entries.find((e) => e.role === "checkbox");
  const combobox = entries.find((e) => e.role === "combobox");
  const searchbox = entries.find((e) => e.role === "searchbox");
  const siteHost = new URL(ctx.finalUrl).hostname;
  const sameSiteLink = entries
    .map((e) => e.url)
    .find((u): u is string => {
      if (!u) return false;
      try {
        const t = new URL(u, ctx.finalUrl);
        return /^https?:$/.test(t.protocol) && sameSite(t.hostname, siteHost) && t.href.split("#")[0] !== ctx.finalUrl.split("#")[0];
      } catch {
        return false;
      }
    });
  ctx.ctaRef = cta?.ref;
  ctx.hasCheckbox = Boolean(checkbox);
  ctx.hasCombobox = Boolean(combobox);
  ctx.hasSearchbox = Boolean(searchbox);
  ctx.sameSiteLink = sameSiteLink ? new URL(sameSiteLink, ctx.finalUrl).href : undefined;

  // AC-06 keyboard
  for (let i = 1; i <= 3; i++) await run(`tab${i}`, "AC-06 press Tab", ["press", "Tab"]);
  await run("focus", "AC-06 focused element", ["eval", JS.focus]);

  // IN-01 main button: visible and enabled, never clicked
  if (cta) {
    await run("ctaVisible", "IN-01 is visible", ["is", "visible", cta.ref]);
    await run("ctaEnabled", "IN-01 is enabled", ["is", "enabled", cta.ref]);
  }

  // IN-02 a disabled control must refuse a click (clicking a disabled control does nothing)
  await run("disabledCount", "IN-02 disabled controls", ["eval", JS.disabled]);
  ctx.disabledCount = Number(value("disabledCount")) || 0;
  if (ctx.disabledCount) await run("disabledClick", "IN-02 click disabled", ["click", "button:disabled"]);

  // IN-06 checkbox (restored afterwards) or dropdown; no form is submitted
  if (checkbox) {
    await run("chkBefore", "IN-06 checked before", ["is", "checked", checkbox.ref]);
    const wasChecked = value("chkBefore") === true || value("chkBefore") === "true";
    await run("chkCheck", "IN-06 toggle", [wasChecked ? "uncheck" : "check", checkbox.ref]);
    await run("chkState", "IN-06 checked after", ["is", "checked", checkbox.ref]);
    const nowChecked = value("chkState") === true || value("chkState") === "true";
    raw.chkAfter = { ok: true, ms: 0, data: nowChecked !== wasChecked }; // true = state changed
    await run("chkRestore", "IN-06 restore", [wasChecked ? "check" : "uncheck", checkbox.ref]);
  } else if (combobox) {
    await run("comboEnabled", "IN-06 dropdown enabled", ["is", "enabled", combobox.ref]);
  }

  // Screenshots and PDF of the desktop page (VR-01, VR-04, VR-08)
  await run("shotDesktop", "VR-01 desktop screenshot", ["screenshot", "--annotate", "/tmp/st-desktop.jpg", ...SHOT]);
  images.desktop = await image("/tmp/st-desktop.jpg");
  await run("shotFull", "VR-04 full-page screenshot", ["screenshot", "--full", "/tmp/st-full.jpg", ...SHOT]);
  images.full = await image("/tmp/st-full.jpg");
  await run("pdf", "VR-08 PDF", ["pdf", "/tmp/st-page.pdf"]);
  if (raw.pdf.ok) {
    const t0 = Date.now();
    const r = await readSandboxFile(sandbox, "/tmp/st-page.pdf", PDF_MAX_BYTES, "pdf");
    pdf = r.b64;
    // recorded so the report can say why there is no download button
    raw.pdfRead = { ok: Boolean(r.b64), ms: Date.now() - t0, data: r.note, error: r.b64 ? undefined : r.note };
    steps.push({ name: "VR-08 read PDF back", ok: Boolean(r.b64), ms: raw.pdfRead.ms, error: raw.pdfRead.error });
  }

  // Reload checks: LN-08, VR-06, VR-07, IN-08
  await run("shotBase", "VR-06 baseline", ["screenshot", "/tmp/st-base.jpg", ...SHOT]);
  if (cta) {
    await run("refBefore", "IN-08 text before reload", ["get", "text", cta.ref]);
    ctx.refTextBefore = String(value("refBefore") ?? "").trim();
  }
  await run("reload", "LN-08 reload", ["reload"]);
  await run("reloadWait", "LN-08 wait", ["wait", "--load", "networkidle"]);
  await run("reloadUrl", "LN-08 URL after reload", ["get", "url"]);
  if (cta) await run("refAfter", "IN-08 old ref after reload", ["get", "text", cta.ref]);
  await run("diffSnap", "VR-07 structure diff", ["diff", "snapshot"]);
  await run("diffShot", "VR-06 visual diff", ["diff", "screenshot", "--baseline", "/tmp/st-base.jpg"]);

  // SP-01 desktop speed, SP-05 trace
  await run("vitalsDesktop", "SP-01 desktop speed", ["vitals", url]);
  await run("traceStart", "SP-05 trace start", ["trace", "start"]);
  await run("traceReload", "SP-05 reload", ["reload"]);
  await run("traceWait", "SP-05 wait", ["wait", "--load", "networkidle"]);
  await run("traceStop", "SP-05 trace stop", ["trace", "stop", "/tmp/st-trace.json"]);

  // LN-09 back / forward via a same-site link (opened by address, not clicked)
  if (ctx.sameSiteLink) {
    await run("navOpen", "LN-09 open linked page", ["open", ctx.sameSiteLink]);
    await run("navBack", "LN-09 back", ["back"]);
    await run("navBackUrl", "LN-09 URL after back", ["get", "url"]);
    await run("navFwd", "LN-09 forward", ["forward"]);
    await run("navFwdUrl", "LN-09 URL after forward", ["get", "url"]);
    await run("navReturn", "Return to start page", ["open", ctx.finalUrl]);
  }

  // IN-05 site search (only if a search box exists; a harmless word)
  if (searchbox) {
    await run("searchFill", "IN-05 type in search", ["fill", searchbox.ref, "test"]);
    await run("searchEnter", "IN-05 press Enter", ["press", "Enter"]);
    await run("searchWait", "IN-05 wait", ["wait", "--load", "networkidle"]);
    await run("searchUrl", "IN-05 URL after search", ["get", "url"]);
    await run("searchReturn", "Return to start page", ["open", ctx.finalUrl]);
  }

  // Dark mode: AC-02, VR-05
  await run("darkOn", "Dark mode on", ["set", "media", "dark"]);
  await run("darkReload", "Reload in dark mode", ["reload"]);
  await run("darkWait", "Wait", ["wait", "--load", "networkidle"]);
  await run("a11yDark", "AC-02 accessibility (dark)", ["a11y"]);
  await run("shotDark", "VR-05 dark screenshot", ["screenshot", "/tmp/st-dark.jpg", ...SHOT]);
  images.dark = await image("/tmp/st-dark.jpg");
  await run("darkOff", "Dark mode off", ["set", "media", "light"]);

  // Phone: AC-04, VR-02, SP-02
  await run("mobileDevice", "Phone screen (iPhone 14)", ["set", "device", "iPhone 14"]);
  await run("mobileReload", "Reload on phone", ["reload"]);
  await run("mobileWait", "Wait", ["wait", "--load", "networkidle"]);
  await run("a11yMobile", "AC-04 accessibility (phone)", ["a11y"]);
  await run("shotMobile", "VR-02 phone screenshot", ["screenshot", "--annotate", "/tmp/st-mobile.jpg", ...SHOT]);
  images.mobile = await image("/tmp/st-mobile.jpg");
  await run("vitalsMobile", "SP-02 phone speed", ["vitals", url]);

  // VR-03 small screen
  await run("viewport", "VR-03 360 px viewport", ["set", "viewport", "360", "800"]);
  await run("vpReload", "Reload", ["reload"]);
  await run("vpWait", "Wait", ["wait", "--load", "networkidle"]);
  await run("scrollFit", "VR-03 sideways scroll", ["eval", JS.scrollFit]);
  await run("viewportBack", "Desktop viewport", ["set", "viewport", "1280", "800"]);

  // ST-06 offline
  await run("offOn", "Offline on", ["set", "offline", "on"]);
  await run("offReload", "ST-06 reload offline", ["reload"]);
  await run("offText", "ST-06 offline page", ["eval", JS.offline]);
  await run("shotOffline", "ST-06 offline screenshot", ["screenshot", "/tmp/st-offline.jpg", ...SHOT]);
  images.offline = await image("/tmp/st-offline.jpg");
  await run("offOff", "Offline off", ["set", "offline", "off"]);

  // LN-05 http -> https
  if (ctx.isHttps) {
    ctx.httpTried = true;
    await run("httpOpen", "LN-05 open http", ["open", url.replace(/^https:/, "http:")]);
    await run("httpUrl", "LN-05 URL", ["get", "url"]);
  }
  await run("close1", "Close", ["close"]);

  // Reads without a browser: AI-04, AI-05, AI-07, SF-03, SF-04
  await run("read", "AI-05 readable text", ["--max-output", "50000", "--content-boundaries", "read", url]);
  await run("llms", "AI-04 llms.txt", ["read", url, "--llms", "index"]);
  await run("readMd", "AI-07 markdown", ["read", url, "--require-md"]);

  // SP-04 React (fresh browser with the React DevTools hook)
  await run("reactOpen", "SP-04 open with React hook", ["open", "--enable", "react-devtools", url]);
  await run("reactWait", "Wait", ["wait", "--load", "networkidle"]);
  await run("reactTree", "SP-04 React tree", ["react", "tree"]);
  if (raw.reactTree.ok) await run("reactVitals", "SP-04 hydration", ["vitals"]);
  await run("close2", "Close", ["close"]);

  // PR-03 only the site's own domain allowed (fresh browser)
  const base = baseHost(siteHost);
  await run("allowedOpen", "PR-03 open with allowed domains", ["--allowed-domains", `${base},*.${base}`, "open", url]);
  await run("close3", "Close", ["close"]);

  // eval results come back as JSON strings; make sure they parse before reporting
  for (const key of ["overlay", "labels", "blank", "offText"]) {
    if (raw[key]?.ok && evalJson(raw[key].data) === undefined) raw[key].ok = false;
  }
  return { raw, steps, images, pdf, ctx };
}

/* ------------------------------------------------------------------ */
/* Route                                                               */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  // Add a rate limit before going public (for example a Vercel Firewall rule):
  // every run starts a paid sandbox.
  let body: { url?: unknown; consent?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400, headers: NO_STORE });
  }
  if (body.consent !== true) {
    return NextResponse.json({ error: "Please confirm you own this website or have permission to test it." }, { status: 400, headers: NO_STORE });
  }
  const checked = await checkUrl(body.url);
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400, headers: NO_STORE });

  const startedAt = Date.now();
  try {
    const result = await withAgentBrowserSandbox(
      (sandbox) => runAllCases(sandbox, checked.url, startedAt + BUDGET_MS),
      // Option name from the @agent-browser/sandbox README; confirm it against the package's types.
      { installSpec: `agent-browser@${AGENT_BROWSER_VERSION}` } as Parameters<typeof withAgentBrowserSandbox>[1],
    );
    if (!result.raw.open?.ok) {
      return NextResponse.json({ error: "The website could not be opened. It may be down or blocking automated browsers." }, { status: 502, headers: NO_STORE });
    }
    const report = buildFullReport({ url: checked.url, ...result, startedAt });
    return NextResponse.json(report, { headers: NO_STORE });
  } catch {
    console.error("site-test: sandbox run failed"); // deliberately no URL or page content
    return NextResponse.json({ error: "The test could not finish. Please try again in a minute." }, { status: 500, headers: NO_STORE });
  }
}