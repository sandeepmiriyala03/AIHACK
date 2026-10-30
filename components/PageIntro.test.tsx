/** @jest-environment node */
import { renderToStaticMarkup } from "react-dom/server";
import PageIntro from "./PageIntro";

describe("PageIntro (server HTML before the tool loads)", () => {
  test("renders a heading, description, steps and links", () => {
    const html = renderToStaticMarkup(<PageIntro href="/calendarpage" />);
    expect(html).toContain("<h1>Panchanga Calendar</h1>");
    expect(html).toContain("Tithi and Nakshatra");
    expect(html).toContain("<ol>");
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/llms.txt"');
    expect(html.replace(/<[^>]+>/g, "").length).toBeGreaterThan(300);
  });
  test("renders nothing for an unknown page", () => {
    expect(renderToStaticMarkup(<PageIntro href="/nope" />)).toBe("");
  });
});
