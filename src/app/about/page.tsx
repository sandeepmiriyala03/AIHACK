"use client";
export const dynamic = "force-dynamic";

import { useState, type ReactNode } from "react";
import Navbar from "@/components/Navbar";
import GoToTopButton from "@/components/GoToTopButton";

const YUKTAI_VERSION = "5.1.0";
const NPM_URL = "https://www.npmjs.com/package/@yuktishaalaa/yuktai";
const GITHUB_URL = "https://github.com/sandeepmiriyala03/yuktai";

type SectionKey =
  | "yuktai"
  | "agentic"
  | "framework"
  | "browserAi"
  | "ocr"
  | "languageData"
  | "installation"
  | "summary";

const ExternalLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
    {children}
  </a>
);

const SECTIONS: { key: SectionKey; title: string; badge?: string; body: ReactNode }[] = [
  {
    key: "yuktai",
    title: "Yuktai Framework",
    badge: `v${YUKTAI_VERSION}`,
    body: (
      <>
        <p className="mt-4 text-gray-800">
          AksharaTantra is built on <strong>@yuktishaalaa/yuktai</strong>, a free, open-source Next.js package for
          accessibility, AI and data. Everything runs in the browser: no API keys, no server, works offline.
        </p>
        <ul className="mt-4 space-y-2 text-gray-800">
          <li><strong>Accessibility Engine:</strong> WCAG 2.2 auto-fix, speak on focus, colour-blind modes, dyslexia font, skip links.</li>
          <li><strong>YuktaiGrid:</strong> accessible data grid with an AI assistant, WebMCP, 5 WCAG themes and English/Telugu UI.</li>
          <li><strong>In-Tab RAG:</strong> ask questions about any page, offline.</li>
          <li><strong>Autonomous AI Agent:</strong> plain-English goals turned into step-by-step guidance on the page.</li>
          <li><strong>Vibe Coder:</strong> generates full Next.js projects from a plain-English description.</li>
          <li><strong>Agentic AI Toolkit</strong> (new in v5.1): see the next section.</li>
        </ul>
        <p className="mt-4 text-gray-800">
          <ExternalLink href={NPM_URL}>npm package</ExternalLink>{" · "}
          <ExternalLink href={GITHUB_URL}>GitHub</ExternalLink>{" · "}
          <a href="/staffdirectory" className="text-blue-700 underline">Live grid demo</a>
        </p>
      </>
    ),
  },
  {
    key: "agentic",
    title: "Agentic AI Toolkit",
    badge: "New in v5.1",
    body: (
      <>
        <p className="mt-4 text-gray-800">
          Ten agentic features that audit, explain and fix pages, and answer questions about data. All rule-based and
          on-device, so no page or grid data leaves the browser.
        </p>
        <ul className="mt-4 space-y-2 text-gray-800">
          <li><strong>Accessibility Copilot:</strong> watches the page, explains each issue in plain English, applies safe fixes and can undo them.</li>
          <li><strong>QA Tester:</strong> 15 WCAG checks with a score, pass/fail and a downloadable Markdown or JSON report.</li>
          <li><strong>Page Understanding:</strong> answers &quot;What does this page do?&quot; and &quot;Which fields are missing labels?&quot;</li>
          <li><strong>Forms Agent:</strong> reviews labels, autocomplete, error messages and senior-friendliness.</li>
          <li><strong>Smart Data Grid:</strong> turns &quot;salary over 1 lakh&quot; into real filters, finds unusual rows, summarises data.</li>
          <li><strong>BI Copilot:</strong> totals, averages, group-by, period comparison and trends.</li>
          <li><strong>Multi-Step Tasks:</strong> &quot;filter, then highlight, then summarise what changed&quot;.</li>
          <li><strong>Page + Data RAG:</strong> keyword search over page text and grid rows, Telugu-aware.</li>
          <li><strong>Voice Accessibility:</strong> &quot;turn on high contrast&quot;, &quot;bigger text&quot;, &quot;next row&quot;, including Telugu phrases.</li>
          <li><strong>Design Review:</strong> hierarchy, readability, focus states, clutter and consistency.</li>
        </ul>
        <p className="mt-4 text-gray-700 text-sm">
          Questions are understood with rules rather than a language model, so unusual phrasing may need rewording.
          The automatic checks catch common problems but don&apos;t replace testing with real users and assistive technology.
        </p>
      </>
    ),
  },
  {
    key: "framework",
    title: "Framework and Platform",
    body: (
      <ul className="mt-4 space-y-2 text-gray-800">
        <li><strong>Next.js:</strong> React framework for SSR, SSG and API routes enabling fast, SEO-friendly apps.</li>
        <li><strong>React + TypeScript:</strong> typed, component-based UI.</li>
        <li><strong>MUI and Tailwind CSS:</strong> layout, components and styling.</li>
        <li><strong>Progressive Web App (PWA):</strong> offline support and installation on desktop and mobile.</li>
      </ul>
    ),
  },
  {
    key: "browserAi",
    title: "In-Browser AI",
    body: (
      <ul className="mt-4 space-y-2 text-gray-800">
        <li><strong>Gemini Nano (Chrome):</strong> on-device summaries, rewriting and translation on desktop Chrome.</li>
        <li><strong>Transformers.js:</strong> on-device models for mobile and other browsers, cached after the first load.</li>
        <li><strong>Web Speech API:</strong> voice input and read-aloud for the assistant and accessibility features.</li>
        <li><strong>WebMCP:</strong> exposes grid actions to browser AI agents through <code>document.modelContext</code>.</li>
      </ul>
    ),
  },
  {
    key: "ocr",
    title: "OCR and Document Processing",
    body: (
      <ul className="mt-4 space-y-2 text-gray-800">
        <li><strong>Tesseract.js:</strong> OCR engine for multi-language text recognition.</li>
        <li><strong>pdf-parse:</strong> extracts text directly from PDFs.</li>
        <li><strong>mammoth:</strong> extracts text from DOCX files.</li>
        <li><strong>pptx2json:</strong> parses PPTX slides.</li>
        <li><strong>Compromise (NLP):</strong> keyword extraction.</li>
      </ul>
    ),
  },
  {
    key: "languageData",
    title: "OCR Language Data and Models",
    body: (
      <>
        <p className="mt-4 text-gray-800">OCR trained models (.traineddata files) are sourced from:</p>
        <ul className="mt-2 space-y-2">
          <li><ExternalLink href="https://github.com/tesseract-ocr/tessdata_best">tessdata_best</ExternalLink>: high-quality OCR models</li>
          <li><ExternalLink href="https://github.com/tesseract-ocr/tessdata">tessdata</ExternalLink>: standard OCR models</li>
        </ul>
        <p className="mt-3">Language data is placed in <code>public/tessdata</code>.</p>
      </>
    ),
  },
  {
    key: "installation",
    title: "Installation and Testing",
    body: (
      <ul className="mt-4 space-y-2 text-gray-800">
        <li>Install the app as a PWA on desktop and mobile.</li>
        <li>Use Yuktai in your own Next.js app: <code>npm install @yuktishaalaa/yuktai --legacy-peer-deps</code></li>
        <li>Yuktai v5.1 ships with 30 automated tests (Vitest + happy-dom).</li>
        <li>OCR accuracy is validated manually on sample images.</li>
        <li>Performance tested with chunk concurrency control.</li>
      </ul>
    ),
  },
  {
    key: "summary",
    title: "Summary",
    body: (
      <p className="mt-4 text-gray-800">
        AksharaTantra combines Next.js and PWA with OCR, NLP and the Yuktai framework to deliver fast, private text
        extraction and an accessible, agentic data experience. Everything runs in the browser, with no API keys and no
        data uploaded.
      </p>
    ),
  },
];

export default function About() {
  // Yuktai sections open by default; the rest start closed
  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>({
    yuktai: true,
    agentic: true,
    framework: false,
    browserAi: false,
    ocr: false,
    languageData: false,
    installation: false,
    summary: false,
  });

  const toggleSection = (key: SectionKey) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <>
      <Navbar />

      <main className="bg-white text-black min-h-screen py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-3 text-center">Tools and Technologies Used</h1>
          <p className="text-center text-gray-700 mb-10">
            Powered by Yuktai v{YUKTAI_VERSION}: accessibility and agentic AI for Next.js, free and open source.
          </p>

          {SECTIONS.map((s) => {
            const isOpen = expanded[s.key];
            const panelId = `about-panel-${s.key}`;
            return (
              <section key={s.key} className="border border-gray-200 rounded-lg p-6 mb-6 bg-white">
                <h2 className="text-xl font-semibold">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggleSection(s.key)}
                    className="w-full flex justify-between items-center text-left gap-3 cursor-pointer"
                  >
                    <span className="flex items-center gap-2 flex-wrap">
                      {s.title}
                      {s.badge && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-700 text-white">
                          {s.badge}
                        </span>
                      )}
                    </span>
                    <span aria-hidden="true">{isOpen ? "▾" : "▸"}</span>
                  </button>
                </h2>
                {isOpen && <div id={panelId}>{s.body}</div>}
              </section>
            );
          })}
        </div>
      </main>

      <GoToTopButton />
    </>
  );
}