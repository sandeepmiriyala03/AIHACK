/** @jest-environment node */
import { llmsTxt, markdownFor, MARKDOWN_HEADERS, prefersMarkdown } from "./agent-markdown";
import { PAGES } from "./site-content";

describe("prefersMarkdown (Accept header)", () => {
  test.each([
    ["text/markdown", true],
    ["text/markdown; charset=utf-8", true],
    ["text/markdown, text/html;q=0.9", true],
    ["text/html, text/markdown", true], // equal quality: Markdown wins, it was asked for
    ["text/x-markdown", true],
    ["text/html", false],
    ["text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", false], // a browser
    ["*/*", false],
    ["text/html, text/markdown;q=0.5", false],
    ["text/markdown;q=0", false],
    ["", false],
  ])("%s → %s", (accept, want) => {
    expect(prefersMarkdown(accept)).toBe(want);
  });
  test("missing header", () => expect(prefersMarkdown(null)).toBe(false));
});

describe("markdownFor", () => {
  test("homepage: H1, every listed tool, developer resources, llms.txt link, over 500 characters", () => {
    const { status, body } = markdownFor("/");
    expect(status).toBe(200);
    expect(body.startsWith("# AksharaTantra\n")).toBe(true);
    expect(body.length).toBeGreaterThan(500);
    for (const p of PAGES.filter((x) => x.listed && x.href !== "/")) {
      expect(body).toContain(`(https://aksharatantra.miriyala.in${p.href})`);
    }
    expect(body).toContain("## Developer resources");
    expect(body).toContain("https://aksharatantra.miriyala.in/llms.txt");
  });

  test("a tool page", () => {
    const { status, body } = markdownFor("/calendarpage");
    expect(status).toBe(200);
    expect(body).toMatch(/^# Panchanga Calendar\n/);
    expect(body).toContain("## How to use");
  });

  test("query string and trailing slash are ignored", () => {
    expect(markdownFor("/ocreng/?x=1").status).toBe(200);
  });

  test("unknown path: 404 with an explanation and links to llms.txt and the sitemap", () => {
    const { status, body } = markdownFor("/__ora-404-probe-nj1v7c7h");
    expect(status).toBe(404);
    expect(body.length).toBeGreaterThanOrEqual(20);
    expect(body).toContain("# 404");
    expect(body).toContain("/llms.txt");
    expect(body).toContain("/sitemap.xml");
  });

  test("404 does not echo backticks or new lines from the path", () => {
    const { body } = markdownFor("/a`b\n# injected");
    expect(body).not.toContain("\n# injected");
    expect(body).not.toContain("a`b");
  });

  test("headers: text/markdown and Vary: Accept", () => {
    expect(MARKDOWN_HEADERS["Content-Type"]).toBe("text/markdown; charset=utf-8");
    expect(MARKDOWN_HEADERS.Vary).toBe("Accept");
  });
});

describe("llms.txt (llmstxt.org format)", () => {
  const txt = llmsTxt();
  test("starts with an H1 and a blockquote summary", () => {
    const lines = txt.split("\n");
    expect(lines[0]).toBe("# AksharaTantra");
    expect(lines[1]).toBe("");
    expect(lines[2].startsWith("> ")).toBe(true);
  });
  test("sections are H2s with Markdown link lists", () => {
    expect(txt).toContain("## Developer resources");
    expect(txt).toContain("## Optional");
    const items = txt.split("\n").filter((l) => l.startsWith("- "));
    expect(items.length).toBeGreaterThan(20);
    for (const l of items) expect(l).toMatch(/^- \[[^\]]+\]\(https:\/\/[^)]+\)(: .+)?$/);
  });
  test("names the product and its developer resources", () => {
    expect(txt).toContain("YuktAI documentation");
    expect(txt).toContain("https://www.npmjs.com/package/@yuktishaalaa/yuktai");
    expect(txt).toContain("Sandeep Miriyala");
  });
});
