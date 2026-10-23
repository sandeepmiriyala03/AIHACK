# "Test your website": all 59 agent-browser test cases

A visitor enters a URL on AksharaTantra. The server runs **all 59 test cases** with
agent-browser (Vercel Labs) inside a throwaway Vercel Sandbox and the page shows one
report: overall score, 9 area scores, screenshots, every test with its result, speed,
accessibility issues and every command that ran. Nothing is saved.

## Files

| File | Put it at | What it does |
| --- | --- | --- |
| `app/test-your-website/page.tsx` | same path | The page: form, progress, report, downloads |
| `app/api/site-test/route.ts` | same path | Runs about 90 agent-browser commands for the 59 cases |
| `lib/siteTest.ts` | same path | The 59 cases, parsers, pass/fail rules, scores, Markdown export |
| `lib/urlSafety.ts` | same path | Blocks localhost, private networks and cloud metadata (SSRF) |
| `lib/siteTest.test.ts` | same path | 113 unit tests (vitest) |

Page URL after deploy: `https://aksharatantra.miriyala.in/test-your-website`

## Setup

1. Install:
   ```
   npm install @agent-browser/sandbox @vercel/sandbox --legacy-peer-deps
   ```
2. Enable Vercel Sandbox for the project. For local `npm run dev`, run `vercel env pull` first.
3. Env vars (optional but recommended):
   - `AGENT_BROWSER_VERSION` (default `0.39.2`). Several cases need this version.
   - `AGENT_BROWSER_SNAPSHOT_ID`: a prebuilt sandbox snapshot, so Chrome is not installed on every run.
4. **Function duration:** the route sets `maxDuration = 800` because all 59 cases take
   several minutes. Lower it if your plan does not allow 800 s, and expect fewer cases to finish.
5. **Rate limit before going public.** Every run starts a paid sandbox. A Vercel Firewall rule
   on `/api/site-test` (for example 2 runs per IP per 15 minutes) is the simplest option.
6. Run the tests: `npx vitest run lib`

## What runs, in order

1. **SF-01** open `about:blank` with a missing policy file (must be refused), close.
2. **Desktop session** (with `--confirm-actions download`, SF-02): open, cookies (PR-01), wait,
   title, URL, `lang`, meta description, `snapshot -i --urls`, `webmcp list`, h1 count, errors,
   console, network requests (all and API 5xx), dialog, local storage, `a11y`, `a11y --tags`,
   overlay / label / new-tab-link scripts.
3. **Safe interaction:** 3 × Tab and focus check; first named button `is visible` / `is enabled`
   (never clicked); one click on a disabled control (does nothing by definition); one checkbox
   toggled and restored, or dropdown `is enabled`.
4. **Desktop screenshots and PDF**, then **reload checks** (same URL, visual and structure diff,
   old ref).
5. **Desktop speed** and a **trace** around a reload.
6. **Back / forward** via a same-site link (opened by address, not clicked).
7. **Search** with the word `test`, only if the page has a search box.
8. **Dark mode** audit and screenshot. **Phone** (iPhone 14) audit, screenshot and speed.
   **360 px** sideways-scroll check. **Offline** reload.
9. **http → https** redirect.
10. **Without a browser:** `read` (with `--max-output` and `--content-boundaries`), llms.txt, markdown.
11. **React** check in a fresh browser with the DevTools hook.
12. **Allowed domains** check in a fresh browser.

## Safety on the visitor's site

- Never clicks a normal button or link, never submits a form, never downloads.
- The only changes: one search for "test" (if a search box exists) and one checkbox toggled
  and put back. The consent text on the page says exactly this.
- Visitors must confirm they own the site or have permission.

## Privacy

- No database, no file storage, no URL in logs, `Cache-Control: no-store`.
- Screenshots (JPEG, max 350 KB each) and the page PDF (max 800 KB) come back inside the one
  response and live only in the visitor's tab. Larger files are left out.
- The sandbox, its browser, cookies and files are deleted after the run.

## What was tested and what was not

| Part | Tested? |
| --- | --- |
| 59-case catalog, parsers, pass/fail rules, scores (`lib/siteTest.ts`) | 113 unit tests pass, with sample agent-browser output for a healthy site, a broken site and a site that did not open |
| URL safety (`lib/urlSafety.ts`) | Unit tested: private IPs, metadata IP, localhost, other schemes, DNS pointing to private IPs. The tests found and fixed one bug (`ftp://` was being wrapped as https) |
| Route and page | Type-checked in strict mode against stand-in types for Next.js, MUI and the sandbox package. **Not run** against a live sandbox or in a browser |
| Real agent-browser JSON shapes | **Not confirmed.** The sample output was modelled on the README and on outputs from your own runs |

**First real run:** open "Every command that ran" at the bottom of the report. Each ✗ there
(or an "Error" result) points to a command whose real JSON differs from what the parser
expects; fix that parser in `lib/siteTest.ts` and add the real output as a new unit test.

Also confirm against the package types:
- `withAgentBrowserSandbox(fn, { installSpec })` option name.
- That the sandbox object has `readFile({ path })`. Without it the report still works, but
  without screenshots and PDF.
- `webmcp list` and `diff snapshot` (without a baseline) on your agent-browser version.
