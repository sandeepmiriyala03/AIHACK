// ─────────────────────────────────────────────────────────────────────────────
// lib/site-content.ts — one plain-text description of AksharaTantra for agents
//
// Used by:
//   • src/proxy.ts + /api/agent-md  → Markdown answers (Accept: text/markdown)
//   • /llms.txt, /sitemap.xml, /robots.txt
//   • components/PageIntro.tsx       → text in the raw HTML of pages that only
//                                      draw their tool after JavaScript runs
//   • src/app/page.tsx               → JSON-LD on the homepage
//
// Plain module (no "use client"), so server routes can read the data.
// When you add a page under src/app, add it to PAGES too:
// lib/site-content.test.ts fails until every route is listed.
// ─────────────────────────────────────────────────────────────────────────────

export const SITE = {
  name: "AksharaTantra",
  url: "https://aksharatantra.miriyala.in",
  tagline: "Read, digitize and speak Indian languages",
  description:
    "AksharaTantra is a free, open-source set of small AI tools that run in the browser: OCR for 34+ languages " +
    "(Sanskrit, Telugu, Hindi, Tamil and other Indic scripts), handwriting reading, text to speech, a Sanskrit " +
    "reader, poster and certificate makers, and Yuktai Grid, an accessible data grid you can ask questions in plain English. " +
    "No sign-up and no API keys; images and text stay on your device.",
  author: {
    name: "Sandeep Miriyala",
    url: "https://github.com/sandeepmiriyala03",
    sameAs: [
      "https://github.com/sandeepmiriyala03",
      "https://hub.xerj.org/contributors/sandeepmiriyala03",
    ],
  },
  sourceCode: "https://github.com/sandeepmiriyala03/aihack",
} as const;

/** Developer resources: listed in llms.txt and the homepage Markdown. */
export const DEVELOPER_RESOURCES: { title: string; url: string; desc: string }[] = [
  { title: "YuktAI documentation (YuktaiDocs)", url: "https://yuktaidocs.netlify.app/", desc: "Install and API guide for the yuktai toolkit used by AksharaTantra: accessibility engine, page tools, Yuktai Grid, Rust engines" },
  { title: "YuktAI on GitHub", url: "https://github.com/sandeepmiriyala03/yuktai", desc: "Source code of the yuktai toolkit (GPL-3.0)" },
  { title: "YuktAI on npm", url: "https://www.npmjs.com/package/@yuktishaalaa/yuktai", desc: "npm install @yuktishaalaa/yuktai, for React, Next.js and plain HTML" },
  { title: "YuktAI for Python (PyPI)", url: "https://pypi.org/project/yuktai/", desc: "pip install yuktai, for Django, Flask and FastAPI" },
  { title: "YuktAI for PHP (Packagist)", url: "https://packagist.org/packages/yuktishaalaa/yuktai", desc: "composer require yuktishaalaa/yuktai, for PHP, Laravel and WordPress" },
  { title: "YuktAI plain HTML demo", url: "https://sandeepmiriyala03.github.io/yuktai/vanilla/", desc: "Every yuktai feature on a plain HTML page with one script tag" },
  { title: "AksharaTantra source code", url: "https://github.com/sandeepmiriyala03/aihack", desc: "Next.js source of this site" },
  { title: "XERJ Corpus Hub: sandeepmiriyala03", url: "https://hub.xerj.org/contributors/sandeepmiriyala03", desc: "Worked references from these projects that AI coding agents can retrieve" },
];

export type SitePage = {
  /** Route path exactly as it is under src/app (case matters) */
  href: string;
  title: string;
  group: "Home" | "Yuktai" | "Web Testing" | "Vision AI" | "Language AI" | "Create" | "More";
  /** One line */
  tagline: string;
  /** 1–3 sentences: what the page does and how to use it */
  summary: string;
  /** Steps shown in the raw HTML and the Markdown version */
  steps?: string[];
  /** Listed in sitemap.xml and the main llms.txt sections */
  listed: boolean;
};

export const PAGES: SitePage[] = [
  {
    href: "/", title: "AksharaTantra", group: "Home", listed: true,
    tagline: "Read, digitize and speak Indian languages",
    summary: SITE.description,
  },
  // ── Yuktai ──
  {
    href: "/staffdirectory", title: "Agentic Grid (Yuktai Grid demo)", group: "Yuktai", listed: true,
    tagline: "Ask your data in plain English",
    summary: "A staff directory built with Yuktai Grid. Type a question such as \"salary over 1 lakh\" or \"anything unusual?\" and the grid turns it into real filters, sorting and summaries, and shows what it did. Search runs on a Rust/WebAssembly or TypeScript engine; you can choose and compare their speed.",
    steps: ["Type a question in the assistant box, or use the column filters.", "Read the rule the grid applied, then sort, page or export the rows."],
  },
  {
    href: "/about", title: "About Yuktai", group: "Yuktai", listed: true,
    tagline: "What the yuktai toolkit can do",
    summary: "An overview of yuktai, the open-source toolkit behind this site: an accessibility engine, page tools, in-browser RAG, small AI agents, Yuktai Grid and 163 icons, for Next.js, React and plain HTML.",
  },
  {
    href: "/yuktai", title: "Yuktai live demos", group: "Yuktai", listed: true,
    tagline: "Open-source toolkit, running in your browser",
    summary: "Live demos of the @yuktishaalaa/yuktai functions: accessibility fixes, page Q&A, agents and the grid. Every demo calls the real library in the browser, with no server and no API keys.",
  },
  // ── Web Testing ──
  {
    href: "/test-your-website", title: "Test Your Website", group: "Web Testing", listed: true,
    tagline: "59 automated checks for any public URL",
    summary: "Enter the address of a website you own or may test. A throwaway browser runs 59 checks (accessibility, links, forms, performance and more) and returns one report with screenshots and a PDF. Nothing is saved.",
    steps: ["Enter a public URL and confirm you may test it.", "Wait for the run to finish, then read or download the report."],
  },
  // ── Vision AI ──
  {
    href: "/aksharadrishti", title: "Multilingual OCR (AksharaDrishti)", group: "Vision AI", listed: true,
    tagline: "Multilingual image OCR",
    summary: "Read text from an image that mixes English with any Indic or world script, in one scan. Supports 34+ languages and exports the result as text or PNG with Noto fonts.",
    steps: ["Choose an image and the languages in it.", "Run OCR, then copy, correct or download the text."],
  },
  {
    href: "/OCR", title: "Text Reader (OCR)", group: "Vision AI", listed: true,
    tagline: "Text from any image",
    summary: "Photograph a book page or document and get the text back in 34+ languages, including Sanskrit, Telugu, Hindi and Tamil. Works offline after the first load and can export PDF.",
    steps: ["Upload or photograph a page.", "Pick the language and start OCR.", "Copy or download the text."],
  },
  {
    href: "/ocreng", title: "Handwriting Reader", group: "Vision AI", listed: true,
    tagline: "Read handwritten Indic text",
    summary: "Read handwritten Devanagari, Telugu, Tamil and English with transformer (TrOCR) models that run in the browser, with Tesseract as a fallback. Images are not uploaded.",
    steps: ["Choose the handwriting language.", "Upload one or more images of handwriting.", "Read, correct and download the recognised text."],
  },
  {
    href: "/upload", title: "Book Digitizer", group: "Vision AI", listed: true,
    tagline: "Bulk digitization of scanned books",
    summary: "Run whole scanned books page by page and get structured text out, with chapters, for archives and libraries.",
  },
  // ── Language AI ──
  {
    href: "/voice", title: "Text to Speech", group: "Language AI", listed: true,
    tagline: "Natural audio in 30+ languages",
    summary: "Turn any text into speech in 30+ languages, including Telugu, Hindi, Sanskrit and Tamil, right in the browser, and download the audio.",
    steps: ["Paste or type text and choose a language and voice.", "Play it, adjust speed, and download the audio."],
  },
  {
    href: "/Sanskrit", title: "Sanskrit Reader", group: "Language AI", listed: true,
    tagline: "Akshara-by-akshara reader",
    summary: "Read Sanskrit with transliteration, word meanings and pronunciation audio, one akshara at a time.",
  },
  {
    href: "/vedha", title: "Vedic Digitizer", group: "Language AI", listed: true,
    tagline: "Vedic text digitizer",
    summary: "OCR for Sanskrit and Vedic manuscripts with pitch accents (swaras) marked, exported as HTML.",
  },
  {
    href: "/kosha", title: "Kosha Dictionary", group: "Language AI", listed: true,
    tagline: "Word explorer",
    summary: "Look up word meanings across Sanskrit, Telugu, Hindi and more, offline.",
  },
  // ── Create ──
  {
    href: "/posters", title: "Poster Maker", group: "Create", listed: true,
    tagline: "Posters in 40+ languages",
    summary: "Design posters in 40+ languages with custom fonts and QR codes, and download print-ready images.",
  },
  {
    href: "/badge", title: "Certificates", group: "Create", listed: true,
    tagline: "Certificate maker",
    summary: "Make and print certificates from your own templates, one at a time or in bulk, as PDF.",
    steps: ["Choose or upload a certificate template.", "Enter names (or a list for bulk).", "Preview and download the PDF."],
  },
  {
    href: "/ebook", title: "E-Book Maker", group: "Create", listed: true,
    tagline: "Documents to e-books",
    summary: "Turn documents and OCR output into EPUB e-books with a cover, ready to share or download.",
  },
  {
    href: "/calendarpage", title: "Panchanga Calendar", group: "Create", listed: true,
    tagline: "Personal planner with Panchanga",
    summary: "A month calendar for your own events, with Tithi and Nakshatra shown next to each day. Events are stored only in this browser and it works offline.",
    steps: ["Pick a day in the month view.", "Add an event with a title, time and label.", "Edit or delete events; they stay on this device."],
  },
  {
    href: "/Media", title: "Media", group: "Create", listed: true,
    tagline: "Video walkthrough",
    summary: "A video walkthrough of AksharaTantra showing multilingual OCR and the other tools in use.",
  },
  // ── More (working pages that are not in the menu) ──
  { href: "/rupantarcode", title: "RupantarCode", group: "More", listed: false, tagline: "Any code to Python", summary: "Convert Java, C#, JavaScript, TypeScript and SQL Server code to Python, offline, and download the .py file." },
  { href: "/smsparser", title: "SMS Parser", group: "More", listed: false, tagline: "Bank SMS to CSV", summary: "Paste one or many bank SMS messages and see debits, credits and transfers parsed, with CSV export. Runs in the browser." },
  { href: "/codeagent", title: ".NET Code Review", group: "More", listed: false, tagline: "Local rules only", summary: "Review .NET (C#) code against local rules in the browser, without sending code anywhere." },
  { href: "/kyc", title: "AksharaKYC", group: "More", listed: false, tagline: "Document details reader", summary: "Read details from identity documents in the browser for KYC forms. Images stay on your device." },
  { href: "/chess", title: "Chess", group: "More", listed: false, tagline: "Play chess", summary: "Play chess in the browser." },
  { href: "/ipl", title: "IPL", group: "More", listed: false, tagline: "Cricket game", summary: "A cricket game drawn on canvas in the browser." },
  { href: "/onecrdb", title: "OCR Database", group: "More", listed: false, tagline: "Saved OCR results", summary: "Browse and manage OCR results saved in this browser." },
  { href: "/Ocrwork", title: "OCR Workbench", group: "More", listed: false, tagline: "OCR experiments", summary: "An OCR workbench for trying settings and languages on your images." },
  { href: "/user", title: "User Directory", group: "More", listed: false, tagline: "Directory demo", summary: "A searchable user directory demo." },
];

const byPath = new Map(PAGES.map((p) => [normalizePath(p.href), p]));

/** Path without query, hash or trailing slash ("/OCR/?x=1" → "/OCR"). Case is kept: routes on this site are case-sensitive. */
export function normalizePath(path: string): string {
  const p = path.split(/[?#]/)[0].replace(/\/+$/, "");
  return p === "" ? "/" : p;
}

/** The page for a request path, or undefined when the path is not a page of this site. */
export function findPage(path: string): SitePage | undefined {
  return byPath.get(normalizePath(path));
}

export const absoluteUrl = (href: string) => (href === "/" ? `${SITE.url}/` : `${SITE.url}${href}`);
