/** @jest-environment node */
import fs from "fs";
import path from "path";
import { PAGES, findPage } from "./site-content";

const appDir = path.join(__dirname, "..", "src", "app");

describe("site-content PAGES", () => {
  test("lists every page route under src/app (and nothing else)", () => {
    const routes = fs
      .readdirSync(appDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && fs.existsSync(path.join(appDir, d.name, "page.tsx")))
      .map((d) => `/${d.name}`)
      .concat("/")
      .sort();
    expect(PAGES.map((p) => p.href).sort()).toEqual(routes);
  });

  test("covers every link in the Navbar menu", () => {
    const nav = fs.readFileSync(path.join(__dirname, "..", "components", "Navbar.tsx"), "utf8");
    const hrefs = [...nav.matchAll(/href:\s*"([^"]+)",\s*label:/g)].map((m) => m[1]);
    expect(hrefs.length).toBeGreaterThan(10);
    for (const h of hrefs) expect(findPage(h)?.listed).toBe(true);
  });

  test("every page has a title, a tagline and a summary", () => {
    for (const p of PAGES) {
      expect(p.title.length).toBeGreaterThan(2);
      expect(p.tagline.length).toBeGreaterThan(2);
      expect(p.summary.length).toBeGreaterThan(20);
    }
  });

  test("lookups keep case (routes are case-sensitive)", () => {
    expect(findPage("/OCR")?.title).toBe("Text Reader (OCR)");
    expect(findPage("/ocr")).toBeUndefined();
  });
});
