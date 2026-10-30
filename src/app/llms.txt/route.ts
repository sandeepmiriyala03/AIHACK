// GET /llms.txt — site index for language models (https://llmstxt.org)
import { llmsTxt } from "@/lib/agent-markdown";

export const dynamic = "force-static";

export function GET() {
  return new Response(llmsTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
