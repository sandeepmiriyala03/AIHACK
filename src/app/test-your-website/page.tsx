"use client";

// app/test-your-website/page.tsx
// "Test your website": a visitor enters a URL; the server runs all 59 agent-browser
// test cases and this page shows the report. Nothing is saved: the report, screenshots
// and PDF live only in this browser tab until it is closed.

import React, { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  LinearProgress,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  AREAS,
  METRICS,
  TEST_CASES,
  formatMetric,
  rateMetric,
  scoreColor,
  toMarkdown,
  type FullReport,
  type Rating,
  type Status,
} from "@/lib/siteTest";

// YuktAI Grid: search, sort and mobile cards for the result tables
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const YuktaiGrid = dynamic<any>(() => import("@yuktishaalaa/yuktai").then((m) => m.YuktaiGrid), {
  ssr: false,
  loading: () => <LinearProgress aria-label="Loading the table" />,
});

const PROGRESS_HINTS = [
  "Starting a private, throwaway browser…",
  "Opening your website…",
  "Reading titles, language and meta tags…",
  "Looking at the page the way an AI agent does…",
  "Collecting errors, console messages and requests…",
  "Checking accessibility (light, WCAG)…",
  "Checking keyboard focus, labels and overlays…",
  "Taking desktop and full-page screenshots…",
  "Reloading to compare the page…",
  "Measuring speed on desktop…",
  "Checking dark mode…",
  "Checking a phone screen…",
  "Testing offline behaviour…",
  "Reading the page without JavaScript…",
  "Checking privacy: cookies, storage, domains…",
  "Writing your report…",
];

const STATUS_STYLE: Record<Status, { label: string; icon: string; color: "success" | "warning" | "error" | "default" | "info" }> = {
  pass: { label: "Pass", icon: "✓", color: "success" },
  warn: { label: "Warn", icon: "!", color: "warning" },
  fail: { label: "Fail", icon: "✗", color: "error" },
  skip: { label: "Skip", icon: "–", color: "default" },
  error: { label: "Error", icon: "?", color: "info" },
};

const RATING_CHIP: Record<Rating, { label: string; color: "success" | "warning" | "error" | "default" }> = {
  good: { label: "Good", color: "success" },
  "needs-work": { label: "Needs work", color: "warning" },
  poor: { label: "Poor", color: "error" },
  unknown: { label: "Not measured", color: "default" },
};

const IMPACT_ORDER: Record<string, number> = { critical: 0, serious: 1, moderate: 2, minor: 3 };

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */

function ScoreCard({ label, score, sub, big = false }: { label: string; score: number; sub?: string; big?: boolean }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, textAlign: "center", borderRadius: 3, minWidth: 0 }}>
      <Typography component="p" sx={{ fontSize: big ? "3rem" : "1.9rem", fontWeight: 800, lineHeight: 1.1, color: scoreColor(score) }}>
        {score}
      </Typography>
      <Typography variant="body2" fontWeight={700}>
        {label}
      </Typography>
      {sub && (
        <Typography variant="caption" color="text.secondary">
          {sub}
        </Typography>
      )}
    </Paper>
  );
}

function Section({ title, id, children }: { title: string; id: string; children: React.ReactNode }) {
  return (
    <Box component="section" aria-labelledby={id} sx={{ mt: 5 }}>
      <Typography id={id} variant="h5" component="h2" fontWeight={800} gutterBottom>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function Shot({ src, label }: { src?: string; label: string }) {
  if (!src) return null;
  return (
    <Paper variant="outlined" sx={{ p: 1, borderRadius: 2 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={`${label} screenshot of the tested page`} style={{ width: "100%", height: "auto", display: "block", borderRadius: 6 }} />
      <Typography variant="body2" sx={{ mt: 0.75, textAlign: "center", fontWeight: 600 }}>
        {label}
      </Typography>
    </Paper>
  );
}

function downloadBlob(blob: Blob, name: string) {
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(href), 1000);
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function TestYourWebsitePage() {
  const [url, setUrl] = useState("");
  const [consent, setConsent] = useState(false);
  const [running, setRunning] = useState(false);
  const [hint, setHint] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<FullReport | null>(null);
  const [filter, setFilter] = useState<Status | "all">("all");
  const abortRef = useRef<AbortController | null>(null);
  const reportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!running) return;
    setHint(0);
    const id = window.setInterval(() => setHint((h) => Math.min(h + 1, PROGRESS_HINTS.length - 1)), 15000);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (report) reportRef.current?.focus();
  }, [report]);

  const runTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setReport(null);
    setFilter("all");
    setRunning(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch("/api/site-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, consent }),
        signal: controller.signal,
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({ error: "The server sent an unexpected answer." }));
      if (!res.ok) throw new Error(data.error ?? "The test failed.");
      setReport(data as FullReport);
    } catch (err) {
      if ((err as Error).name !== "AbortError") setError((err as Error).message);
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  };

  const host = useMemo(() => {
    try {
      return report ? new URL(report.finalUrl).hostname : "site";
    } catch {
      return "site";
    }
  }, [report]);

  const resultRows = useMemo(
    () =>
      (report?.results ?? [])
        .filter((r) => filter === "all" || r.status === filter)
        .map((r) => ({
          id: r.id,
          area: AREAS[r.area],
          title: r.title,
          result: `${STATUS_STYLE[r.status].icon} ${STATUS_STYLE[r.status].label}`,
          detail: r.detail,
          command: r.command,
        })),
    [report, filter],
  );

  const issues = useMemo(() => {
    if (!report) return [];
    const { light, dark, mobile, wcag } = report.a11y;
    return [...light.violations, ...dark.violations, ...mobile.violations, ...wcag.violations]
      .sort((a, b) => (IMPACT_ORDER[a.impact] ?? 9) - (IMPACT_ORDER[b.impact] ?? 9))
      .map((v, i) => ({ key: `${v.mode}-${v.id}-${i}`, impact: v.impact, id: v.id, help: v.help, count: v.count, mode: v.mode, where: v.targets.join("  ·  "), helpUrl: v.helpUrl }));
  }, [report]);

  const fixLinks = useMemo(() => [...new Map(issues.filter((v) => v.helpUrl).map((v) => [v.id, v])).values()], [issues]);

  return (
    <Box component="main" sx={{ px: { xs: 2, sm: 4 }, py: { xs: 3, sm: 5 }, maxWidth: 1100, mx: "auto" }}>
      {/* HEADER */}
      <Typography variant="h3" component="h1" fontWeight={800} sx={{ fontSize: { xs: "2rem", sm: "2.8rem" } }}>
        Test your website
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 3, fontSize: "1.05rem" }}>
        {TEST_CASES.length} automatic checks: loading, stability, accessibility, AI-agent readiness, speed, visuals,
        safe interaction checks, privacy and runner safety. Powered by agent-browser from Vercel Labs. Nothing is saved.
      </Typography>

      {/* FORM */}
      <Paper component="form" onSubmit={runTest} variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }} className="no-print">
        <Stack spacing={2}>
          <TextField
            label="Website address"
            placeholder="https://example.com"
            value={url}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
            required
            fullWidth
            disabled={running}
            inputProps={{ inputMode: "url", autoComplete: "url", spellCheck: false }}
          />
          <FormControlLabel
            control={<Checkbox checked={consent} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConsent(e.target.checked)} disabled={running} />}
            label="I own this website or have permission to test it. (The test opens pages, types one search word if a search box exists, and toggles one checkbox back and forth. It never submits forms or clicks normal buttons.)"
          />
          <Stack direction="row" spacing={1.5}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disableElevation
              disabled={running || !url.trim() || !consent}
              sx={{ minHeight: 48, borderRadius: 2, textTransform: "none", fontWeight: 700 }}
            >
              {running ? "Testing…" : `Run all ${TEST_CASES.length} tests`}
            </Button>
            {running && (
              <Button onClick={() => abortRef.current?.abort()} size="large" sx={{ textTransform: "none" }}>
                Cancel
              </Button>
            )}
          </Stack>
        </Stack>

        {running && (
          <Box sx={{ mt: 2.5 }} role="status" aria-live="polite">
            <LinearProgress aria-label="Test in progress" />
            <Typography sx={{ mt: 1, fontWeight: 600 }}>{PROGRESS_HINTS[hint]}</Typography>
            <Typography variant="body2" color="text.secondary">
              A test takes up to 5 minutes. Tests that do not fit in the time limit are shown as skipped. Please keep this tab open.
            </Typography>
          </Box>
        )}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }} role="alert">
          {error}
        </Alert>
      )}

      {/* REPORT */}
      {report && (
        <Box ref={reportRef} tabIndex={-1} sx={{ outline: "none" }} aria-label="Website test report">
          <Divider sx={{ my: 4 }} />
          <Typography variant="h4" component="h2" fontWeight={800}>
            Report
          </Typography>
          <Typography color="text.secondary" sx={{ wordBreak: "break-all" }}>
            {report.title ? `${report.title} · ` : ""}
            {report.finalUrl}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tested {new Date(report.testedAt).toLocaleString()} in {Math.round(report.durationMs / 1000)} s
          </Typography>

          <Stack direction="row" spacing={1.5} sx={{ mt: 2, flexWrap: "wrap", gap: 1.5, "& > *": { m: "0 !important" } }} className="no-print">
            <Button variant="outlined" sx={{ textTransform: "none" }} onClick={() => downloadBlob(new Blob([toMarkdown(report)], { type: "text/markdown;charset=utf-8" }), `website-report-${host}.md`)}>
              Download report (.md)
            </Button>
            <Button variant="outlined" sx={{ textTransform: "none" }} onClick={() => window.print()}>
              Print / save report as PDF
            </Button>
            {report.pdf && (
              <Button
                variant="outlined"
                sx={{ textTransform: "none" }}
                onClick={() => {
                  const bytes = Uint8Array.from(atob(report.pdf as string), (c) => c.charCodeAt(0));
                  downloadBlob(new Blob([bytes], { type: "application/pdf" }), `${host}-page.pdf`);
                }}
              >
                Download the page as PDF (VR-08)
              </Button>
            )}
          </Stack>

          {/* SUMMARY */}
          <Section title="Summary" id="sum">
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(5, 1fr)" }, gap: 1.5 }}>
              <Box sx={{ gridColumn: { xs: "1 / -1", sm: "auto" } }}>
                <ScoreCard label="Overall" score={report.score} sub={`${report.results.length} tests`} big />
              </Box>
              {(Object.keys(STATUS_STYLE) as Status[]).map((s) => (
                <Paper key={s} variant="outlined" sx={{ p: 2, textAlign: "center", borderRadius: 3 }}>
                  <Typography component="p" sx={{ fontSize: "1.9rem", fontWeight: 800, lineHeight: 1.1 }}>
                    {report.counts[s]}
                  </Typography>
                  <Chip size="small" label={`${STATUS_STYLE[s].icon} ${STATUS_STYLE[s].label}`} color={STATUS_STYLE[s].color} variant="outlined" />
                </Paper>
              )).slice(0, 4)}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {report.counts.error} could not run. Score: pass = 1, warn = 0.5, fail or error = 0; skipped tests do not count.
            </Typography>
          </Section>

          {/* AREAS */}
          <Section title="Scores by area" id="areas">
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)", md: "repeat(5, 1fr)" }, gap: 1.5 }}>
              {report.areas.map((a) => (
                <ScoreCard key={a.area} label={a.label} score={a.score} sub={`${a.counts.pass} pass · ${a.counts.warn} warn · ${a.counts.fail} fail`} />
              ))}
            </Box>
          </Section>

          {/* SCREENSHOTS */}
          {Object.values(report.images).some(Boolean) && (
            <Section title="Screenshots" id="shots">
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr" }, gap: 2, alignItems: "start" }}>
                <Shot src={report.images.desktop} label="Desktop (labels match @e refs)" />
                <Shot src={report.images.mobile} label="Phone" />
                <Shot src={report.images.dark} label="Dark mode" />
                <Shot src={report.images.offline} label="Offline" />
              </Box>
              {report.images.full && (
                <Box sx={{ mt: 2, maxHeight: 600, overflowY: "auto" }}>
                  <Shot src={report.images.full} label="Full page" />
                </Box>
              )}
            </Section>
          )}

          {/* ALL TESTS */}
          <Section title={`All ${report.results.length} test cases`} id="tests">
            <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: "wrap", gap: 1, "& > *": { m: "0 !important" } }} role="group" aria-label="Show results">
              {(["all", "fail", "warn", "error", "pass", "skip"] as const).map((s) => (
                <Chip
                  key={s}
                  label={s === "all" ? `All (${report.results.length})` : `${STATUS_STYLE[s].label} (${report.counts[s]})`}
                  color={s === "all" ? "primary" : STATUS_STYLE[s].color}
                  variant={filter === s ? "filled" : "outlined"}
                  onClick={() => setFilter(s)}
                  aria-pressed={filter === s}
                />
              ))}
            </Stack>
            <YuktaiGrid
              data={resultRows}
              rowKey="id"
              columns={[
                { key: "id", label: "ID", sortable: true },
                { key: "area", label: "Area", sortable: true },
                { key: "title", label: "Test" },
                { key: "result", label: "Result", sortable: true },
                { key: "detail", label: "What we found" },
                { key: "command", label: "agent-browser command" },
              ]}
              search
              view="auto"
              pagination={{ pageSize: 20, showSizeChanger: true, sizeOptions: [20, 59] }}
            />
          </Section>

          {/* SPEED */}
          <Section title="Speed" id="speed">
            <Paper variant="outlined" sx={{ borderRadius: 3, overflowX: "auto" }}>
              <Table size="small" aria-label="Page speed, desktop and phone">
                <TableHead>
                  <TableRow>
                    <TableCell>Metric</TableCell>
                    <TableCell>Desktop</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Good is up to</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {METRICS.map((m) => (
                    <TableRow key={m.key}>
                      <TableCell>
                        <strong>{m.key.toUpperCase()}</strong>
                        <Typography variant="body2" color="text.secondary">
                          {m.label}
                        </Typography>
                      </TableCell>
                      {(["desktop", "mobile"] as const).map((d) => {
                        const v = report.vitals[d][m.key];
                        const r = RATING_CHIP[rateMetric(m.key, v)];
                        return (
                          <TableCell key={d}>
                            {formatMetric(m.key, v)} <Chip size="small" label={r.label} color={r.color} variant="outlined" sx={{ ml: 0.5 }} />
                          </TableCell>
                        );
                      })}
                      <TableCell>{formatMetric(m.key, m.good)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              INP needs a real click, so it is often &quot;Not measured&quot; in an automated test.
            </Typography>
          </Section>

          {/* ACCESSIBILITY */}
          <Section title="Accessibility issues" id="a11y">
            <Typography sx={{ mb: 1.5 }}>
              Light: <strong>{report.a11y.light.violations.length}</strong> · Dark: <strong>{report.a11y.dark.violations.length}</strong> · Phone:{" "}
              <strong>{report.a11y.mobile.violations.length}</strong> · WCAG A/AA: <strong>{report.a11y.wcag.violations.length}</strong>
            </Typography>
            {issues.length ? (
              <>
                <YuktaiGrid
                  data={issues}
                  rowKey="key"
                  columns={[
                    { key: "impact", label: "Severity", sortable: true },
                    { key: "id", label: "Rule", sortable: true },
                    { key: "help", label: "What is wrong" },
                    { key: "count", label: "Elements", type: "number", align: "right", sortable: true },
                    { key: "mode", label: "Where tested", sortable: true },
                    { key: "where", label: "CSS selector" },
                  ]}
                  search
                  view="auto"
                  pagination={{ pageSize: 10 }}
                />
                <Typography variant="h6" component="h3" sx={{ mt: 2 }}>
                  How to fix
                </Typography>
                <Box component="ul" sx={{ pl: 3 }}>
                  {fixLinks.map((v) => (
                    <li key={v.id}>
                      <Link href={v.helpUrl} target="_blank" rel="noopener noreferrer">
                        {v.id}
                      </Link>{" "}
                      ({v.impact})
                    </li>
                  ))}
                </Box>
              </>
            ) : (
              <Alert severity="success">No automatic accessibility issues found. Still try the site with a keyboard and a screen reader.</Alert>
            )}
          </Section>

          {/* STEPS */}
          <Section title="Every command that ran" id="steps">
            <details>
              <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                {report.steps.length} agent-browser commands ({report.steps.filter((s) => !s.ok).length} failed)
              </summary>
              <Box component="ol" sx={{ pl: 3, mt: 1, "& li": { mb: 0.5 } }}>
                {report.steps.map((s, i) => (
                  <li key={i}>
                    {s.ok ? "✓" : "✗"} {s.name}{" "}
                    <Typography component="span" variant="body2" color="text.secondary">
                      ({(s.ms / 1000).toFixed(1)} s{s.error ? `, ${s.error}` : ""})
                    </Typography>
                  </li>
                ))}
              </Box>
            </details>
          </Section>

          <Alert severity="info" sx={{ mt: 4 }}>
            Privacy: this report, its screenshots and the PDF were not saved anywhere. The test browser was deleted after the run.
            Download or print the report if you want to keep it.
          </Alert>
        </Box>
      )}

      <style>{`@media print { .no-print { display: none !important; } details { display: block; } }`}</style>
    </Box>
  );
}