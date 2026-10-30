/** @jest-environment node */
import { GET, HEAD } from "./route";

const req = new Request("https://aksharatantra.miriyala.in/api/agent-md");
const ctx = (path?: string[]) => ({ params: Promise.resolve({ path }) });

describe("GET /api/agent-md/[[...path]]", () => {
  test("homepage Markdown: 200, text/markdown, Vary: Accept, non-empty", async () => {
    const res = await GET(req, ctx(undefined));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
    expect(res.headers.get("vary")).toBe("Accept");
    expect(await res.text()).toMatch(/^# AksharaTantra/);
  });

  test("a tool page", async () => {
    const res = await GET(req, ctx(["calendarpage"]));
    expect(res.status).toBe(200);
    expect(await res.text()).toMatch(/^# Panchanga Calendar/);
  });

  test("unknown page: 404 with a Markdown body", async () => {
    const res = await GET(req, ctx(["__ora-404-probe-nj1v7c7h"]));
    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
    const body = await res.text();
    expect(body).toContain("# 404");
    expect(body).toContain("/llms.txt");
  });

  test("HEAD: same status and headers, no body", async () => {
    const res = await HEAD(req, ctx(["nope"]));
    expect(res.status).toBe(404);
    expect(res.headers.get("vary")).toBe("Accept");
    expect(await res.text()).toBe("");
  });
});
