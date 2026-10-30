/** @jest-environment node */
import { NextRequest } from "next/server";
import { config, proxy } from "./proxy";

const req = (path: string, accept?: string, method = "GET") =>
  new NextRequest(`https://aksharatantra.miriyala.in${path}`, { method, headers: accept ? { accept } : {} });

describe("proxy: Markdown content negotiation", () => {
  test("Accept: text/markdown on the homepage is rewritten to the Markdown route", () => {
    const res = proxy(req("/", "text/markdown"));
    expect(new URL(res.headers.get("x-middleware-rewrite")!).pathname).toBe("/api/agent-md");
  });

  test("unknown paths are rewritten too (the route answers 404 in Markdown)", () => {
    const res = proxy(req("/does-not-exist", "text/markdown"));
    expect(new URL(res.headers.get("x-middleware-rewrite")!).pathname).toBe("/api/agent-md/does-not-exist");
  });

  test("tool pages keep their path (and case)", () => {
    expect(new URL(proxy(req("/OCR", "text/markdown")).headers.get("x-middleware-rewrite")!).pathname).toBe("/api/agent-md/OCR");
  });

  test("HEAD is negotiated like GET", () => {
    expect(proxy(req("/", "text/markdown", "HEAD")).headers.get("x-middleware-rewrite")).toBeTruthy();
  });

  test("browsers get the normal page, with Vary: Accept", () => {
    const res = proxy(req("/", "text/html,application/xhtml+xml,*/*;q=0.8"));
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    expect(res.headers.get("x-middleware-next")).toBe("1");
    expect(res.headers.get("vary")).toContain("Accept");
  });

  test("POST is never rewritten", () => {
    expect(proxy(req("/", "text/markdown", "POST")).headers.get("x-middleware-rewrite")).toBeNull();
  });

  test("matcher skips API routes, Next.js files and static files", () => {
    const re = new RegExp(`^${config.matcher[0]}$`);
    for (const p of ["/", "/calendarpage", "/OCR", "/__ora-404-probe-nj1v7c7h"]) expect(re.test(p)).toBe(true);
    for (const p of ["/api/agent-md", "/_next/static/x.js", "/llms.txt", "/sitemap.xml", "/robots.txt", "/sw.js", "/icon-512.png"])
      expect(re.test(p)).toBe(false);
  });
});
