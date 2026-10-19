// ─────────────────────────────────────────────────────────────────────────────
// Next.js proxy → FastAPI (main.py) → Neon
//   /api/employees            → {PYTHON_API_URL}/employees
//   /api/employees/stats      → {PYTHON_API_URL}/employees/stats
//   /api/employees/anomalies  → {PYTHON_API_URL}/employees/anomalies
//   /api/employees/health     → {PYTHON_API_URL}/employees/health
// The browser only talks to this route, so the FastAPI URL and API key stay
// on the server (Vercel environment variables, never NEXT_PUBLIC_*).
// ─────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["", "stats", "anomalies", "health"]);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const base = process.env.PYTHON_API_URL?.replace(/\/+$/, "");
  if (!base) {
    return NextResponse.json(
      { error: "PYTHON_API_URL is not set. Add it in Vercel → Settings → Environment Variables." },
      { status: 500 }
    );
  }

  const { path = [] } = await params;
  const sub = path.join("/");
  if (!ALLOWED.has(sub)) {
    return NextResponse.json({ error: `Unknown endpoint /api/employees/${sub}` }, { status: 404 });
  }

  const target = `${base}/employees${sub ? `/${sub}` : ""}${req.nextUrl.search}`;
  try {
    const res = await fetch(target, {
      cache: "no-store",
      headers: process.env.PYTHON_API_KEY ? { "X-Api-Key": process.env.PYTHON_API_KEY } : {},
      signal: AbortSignal.timeout(20_000),
    });
    const body = await res.text();
    return new NextResponse(body, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return NextResponse.json(
      { error: timedOut ? "The staff API took too long to answer." : "Could not reach the staff API." },
      { status: timedOut ? 504 : 502 }
    );
  }
}
