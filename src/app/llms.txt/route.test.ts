/** @jest-environment node */
import { GET } from "./route";

test("GET /llms.txt returns plain text starting with the H1", async () => {
  const res = GET();
  expect(res.status).toBe(200);
  expect(res.headers.get("content-type")).toBe("text/plain; charset=utf-8");
  expect((await res.text()).startsWith("# AksharaTantra\n\n> ")).toBe(true);
});
