// ─────────────────────────────────────────────────────────────────────────────
// PageIntro — what a tool page is about, in plain HTML.
//
// Some tools draw only after JavaScript runs (they wait for `mounted`). Until
// then they show this instead of an empty page, so the raw HTML that search
// engines and AI agents read has a heading, a description and links.
// After hydration the real tool replaces it. Text comes from lib/site-content.ts.
// ─────────────────────────────────────────────────────────────────────────────
import Link from "next/link";
import { SITE, findPage } from "@/lib/site-content";

export default function PageIntro({ href }: { href: string }) {
  const page = findPage(href);
  if (!page) return null;
  return (
    <main className="container page-intro" aria-busy="true">
      <h1>{page.title}</h1>
      <p><strong>{page.tagline}.</strong> {page.summary}</p>
      {page.steps && page.steps.length > 0 && (
        <>
          <h2>How to use</h2>
          <ol>{page.steps.map((s) => <li key={s}>{s}</li>)}</ol>
        </>
      )}
      <p role="status">Loading the tool…</p>
      <p>
        <Link href="/">All {SITE.name} tools</Link> · <a href="/llms.txt">llms.txt</a>
      </p>
    </main>
  );
}
