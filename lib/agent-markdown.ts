// ─────────────────────────────────────────────────────────────────────────────
// lib/agent-markdown.ts — Markdown versions of pages, for AI agents
//
// Content negotiation (https://acceptmarkdown.com): a request with
// `Accept: text/markdown` gets Markdown with `Content-Type: text/markdown` and
// `Vary: Accept`; browsers asking for text/html keep getting HTML.
// Unknown paths get a Markdown 404 that links to llms.txt and the sitemap.
// ─────────────────────────────────────────────────────────────────────────────
import { DEVELOPER_RESOURCES, PAGES, SITE, absoluteUrl, findPage, type SitePage } from "./site-content";

/**
 * True when the Accept header prefers Markdown over HTML.
 * text/markdown must be listed (q > 0) with a quality at least as high as
 * text/html. Wildcards alone (* / *) never select Markdown.
 */
export function prefersMarkdown(accept: string | null | undefined): boolean {
  if (!accept) return false;
  let md = -1;
  let html = -1;
  for (const part of accept.split(",")) {
    const [type, ...params] = part.trim().toLowerCase().split(";").map((s) => s.trim());
    let q = 1;
    for (const p of params) {
      const m = /^q=([0-9.]+)$/.exec(p);
      if (m) q = Number(m[1]);
    }
    if (!Number.isFinite(q)) q = 0;
    if (type === "text/markdown" || type === "text/x-markdown") md = Math.max(md, q);
    if (type === "text/html" || type === "application/xhtml+xml") html = Math.max(html, q);
  }
  return md > 0 && md >= html;
}

const link = (p: SitePage) => `[${p.title}](${absoluteUrl(p.href)})`;

function homeMarkdown(): string {
  const groups = ["Yuktai", "Web Testing", "Vision AI", "Language AI", "Create"] as const;
  const lines: string[] = [
    `# ${SITE.name}`,
    "",
    `> ${SITE.tagline}. Free, open source, runs in your browser. No sign-up, no API keys.`,
    "",
    SITE.description,
    "",
  ];
  for (const g of groups) {
    lines.push(`## ${g}`, "");
    for (const p of PAGES.filter((x) => x.group === g && x.listed)) lines.push(`- ${link(p)}: ${p.summary}`);
    lines.push("");
  }
  lines.push("## Developer resources", "");
  for (const r of DEVELOPER_RESOURCES) lines.push(`- [${r.title}](${r.url}): ${r.desc}`);
  lines.push(
    "",
    "## For agents",
    "",
    `- [llms.txt](${SITE.url}/llms.txt): index of this site for language models`,
    `- [Sitemap](${SITE.url}/sitemap.xml)`,
    "- Any page URL on this site returns Markdown when requested with `Accept: text/markdown`.",
    "",
    `Made by [${SITE.author.name}](${SITE.author.url}).`,
    "",
  );
  return lines.join("\n");
}

function pageMarkdown(p: SitePage): string {
  const lines = [`# ${p.title}`, "", `> ${p.tagline}. Part of [${SITE.name}](${SITE.url}/).`, "", p.summary, ""];
  if (p.steps?.length) {
    lines.push("## How to use", "");
    p.steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
    lines.push("");
  }
  lines.push(
    "## Notes",
    "",
    "- Runs in the browser; open the page in a browser to use the tool.",
    `- Page: ${absoluteUrl(p.href)}`,
    `- More tools: [${SITE.name} home](${SITE.url}/) · [llms.txt](${SITE.url}/llms.txt)`,
    "",
  );
  return lines.join("\n");
}

export function notFoundMarkdown(path: string): string {
  const safe = path.replace(/[`\r\n]/g, "").slice(0, 200);
  return [
    "# 404: page not found",
    "",
    `There is no page at \`${safe}\` on ${SITE.name}.`,
    "",
    `- [${SITE.name} home](${SITE.url}/)`,
    `- [llms.txt](${SITE.url}/llms.txt): list of all pages and developer resources`,
    `- [Sitemap](${SITE.url}/sitemap.xml)`,
    "",
  ].join("\n");
}

/** Markdown for a request path: status 200 for a page of this site, 404 otherwise. */
export function markdownFor(path: string): { status: 200 | 404; body: string } {
  const page = findPage(path);
  if (!page) return { status: 404, body: notFoundMarkdown(path) };
  return { status: 200, body: page.href === "/" ? homeMarkdown() : pageMarkdown(page) };
}

export const MARKDOWN_HEADERS = {
  "Content-Type": "text/markdown; charset=utf-8",
  Vary: "Accept",
  "Cache-Control": "public, max-age=0, must-revalidate",
  "X-Robots-Tag": "noindex", // the HTML page is the canonical, indexable version
} as const;

/** llms.txt, following https://llmstxt.org */
export function llmsTxt(): string {
  const lines: string[] = [
    `# ${SITE.name}`,
    "",
    `> ${SITE.description}`,
    "",
    `Made by ${SITE.author.name} (${SITE.author.url}). Open source: ${SITE.sourceCode}`,
    "",
    "Every page below also returns Markdown when requested with `Accept: text/markdown`. The tools run in the browser, so an agent can read about a tool here but needs a browser to use it.",
    "",
  ];
  const groups = ["Yuktai", "Web Testing", "Vision AI", "Language AI", "Create"] as const;
  for (const g of groups) {
    lines.push(`## ${g}`, "");
    for (const p of PAGES.filter((x) => x.group === g && x.listed)) lines.push(`- ${link(p)}: ${p.tagline}. ${p.summary}`);
    lines.push("");
  }
  lines.push("## Developer resources", "");
  for (const r of DEVELOPER_RESOURCES) lines.push(`- [${r.title}](${r.url}): ${r.desc}`);
  lines.push("", "## Optional", "");
  for (const p of PAGES.filter((x) => !x.listed)) lines.push(`- ${link(p)}: ${p.summary}`);
  lines.push("");
  return lines.join("\n");
}
