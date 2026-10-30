/** @jest-environment node */
import { homeJsonLd, jsonLdScript } from "./json-ld";

describe("homepage JSON-LD", () => {
  const data = homeJsonLd() as { "@context": string; "@graph": Record<string, unknown>[] };
  const byType = (t: string) => data["@graph"].find((n) => n["@type"] === t)!;

  test("schema.org graph with WebSite, WebApplication and Person", () => {
    expect(data["@context"]).toBe("https://schema.org");
    expect(byType("WebSite")).toMatchObject({ name: "AksharaTantra", url: "https://aksharatantra.miriyala.in/" });
    expect(byType("Person")).toMatchObject({ name: "Sandeep Miriyala" });
    expect((byType("Person").sameAs as string[]).length).toBeGreaterThan(0);
  });

  test("application has name, description, url, offers and author", () => {
    const app = byType("WebApplication");
    expect(app).toMatchObject({ name: "AksharaTantra", url: "https://aksharatantra.miriyala.in/", isAccessibleForFree: true });
    expect(String(app.description).length).toBeGreaterThan(50);
    expect(app.offers).toMatchObject({ "@type": "Offer", price: "0" });
    expect(app.author).toEqual({ "@id": "https://aksharatantra.miriyala.in/#author" });
  });

  test("script text is valid JSON and cannot close the script tag", () => {
    const text = jsonLdScript({ x: "</script><b>" });
    expect(text).not.toContain("</script>");
    expect(JSON.parse(text)).toEqual({ x: "</script><b>" });
    expect(() => JSON.parse(jsonLdScript(homeJsonLd()))).not.toThrow();
  });
});
