// GET /api/agent-md/<page path> → Markdown version of that page (or a Markdown 404).
// src/proxy.ts rewrites page requests with `Accept: text/markdown` here:
//   /calendarpage → /api/agent-md/calendarpage,  / → /api/agent-md
// The page path travels in the URL path (not a query string) so it survives the rewrite.
import { MARKDOWN_HEADERS, markdownFor } from "@/lib/agent-markdown";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ path?: string[] }> };

async function answer(ctx: Ctx, withBody: boolean) {
  const { path = [] } = await ctx.params;
  const { status, body } = markdownFor("/" + path.join("/"));
  return new Response(withBody ? body : null, { status, headers: MARKDOWN_HEADERS });
}

export function GET(_request: Request, ctx: Ctx) {
  return answer(ctx, true);
}

export function HEAD(_request: Request, ctx: Ctx) {
  return answer(ctx, false);
}
