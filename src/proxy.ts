// ─────────────────────────────────────────────────────────────────────────────
// src/proxy.ts — Markdown for AI agents (Next.js 16 Proxy, formerly Middleware)
//
// `Accept: text/markdown` → the same URL answers in Markdown (rewritten to
// /api/agent-md/<path>), with Content-Type: text/markdown and Vary: Accept.
// Unknown paths get a Markdown 404. Browsers (Accept: text/html) are unchanged,
// except that HTML pages also say Vary: Accept so caches keep the two apart.
// See lib/agent-markdown.ts.
// ─────────────────────────────────────────────────────────────────────────────
import { NextResponse, type NextRequest } from "next/server";
import { prefersMarkdown } from "@/lib/agent-markdown";

export function proxy(request: NextRequest) {
  const method = request.method;
  if ((method === "GET" || method === "HEAD") && prefersMarkdown(request.headers.get("accept"))) {
    const url = request.nextUrl.clone();
    // The page path goes into the URL path, so the route sees it after the rewrite
    url.pathname = "/api/agent-md" + (url.pathname === "/" ? "" : url.pathname);
    url.search = "";
    return NextResponse.rewrite(url);
  }
  const res = NextResponse.next();
  res.headers.append("Vary", "Accept");
  return res;
}

export const config = {
  // Pages only: skip API routes, Next.js internals and files with an extension
  // (images, sw.js, manifest.json, llms.txt, sitemap.xml, robots.txt …)
  matcher: ["/((?!api/|_next/|.*\\.[A-Za-z0-9]+$).*)"],
};
