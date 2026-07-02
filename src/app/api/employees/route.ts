// ─────────────────────────────────────────────────────────────
// src/app/api/employees/route.ts
//
// Proxy route for CORS + highlight ID support (v4.2.0)
//
// Query params:
//   ?highlight=top-salary     → returns 5 highest salaries
//   ?highlight=anomaly-salary → returns statistically unusual salaries
//   ?highlight=youngest       → returns 5 youngest employees
//   (no param)                → returns just the data
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";

// ── In-memory cache ──
let cachedData: any[] | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 60_000; // 1 minute

async function fetchAllEmployees(): Promise<any[]> {
  const now = Date.now();
  if (cachedData && now - cacheTime < CACHE_TTL_MS) {
    return cachedData;
  }

  const res = await fetch(
    "https://yuktishaalaa-ai.vercel.app/employee/employees",
    { cache: "no-store", headers: { Accept: "application/json" } }
  );

  if (!res.ok) throw new Error(`Upstream API ${res.status}`);

  const data = await res.json();
  let list: any[] = [];
  if (Array.isArray(data))                list = data;
  else if (Array.isArray(data.employees)) list = data.employees;
  else if (Array.isArray(data.data))      list = data.data;

  cachedData = list;
  cacheTime  = now;
  return list;
}

// ─────────────────────────────────────────────────────────────
// Highlight strategies — return row IDs to highlight
// ─────────────────────────────────────────────────────────────
function computeHighlights(
  data: any[],
  strategy: string
): (string | number)[] {
  if (!Array.isArray(data) || data.length === 0) return [];

  switch (strategy) {
    // Top 5 highest salaries
    case "top-salary": {
      return [...data]
        .filter(r => !isNaN(Number(r.salary)))
        .sort((a, b) => Number(b.salary) - Number(a.salary))
        .slice(0, 5)
        .map(r => r.id);
    }

    // Bottom 5 lowest salaries
    case "low-salary": {
      return [...data]
        .filter(r => !isNaN(Number(r.salary)))
        .sort((a, b) => Number(a.salary) - Number(b.salary))
        .slice(0, 5)
        .map(r => r.id);
    }

    // 5 youngest
    case "youngest": {
      return [...data]
        .filter(r => r.age != null && !isNaN(Number(r.age)))
        .sort((a, b) => Number(a.age) - Number(b.age))
        .slice(0, 5)
        .map(r => r.id);
    }

    // 5 oldest
    case "oldest": {
      return [...data]
        .filter(r => r.age != null && !isNaN(Number(r.age)))
        .sort((a, b) => Number(b.age) - Number(a.age))
        .slice(0, 5)
        .map(r => r.id);
    }

    // Salary anomalies (IQR method — statistically unusual)
    case "anomaly-salary": {
      const salaries = data
        .map(r => Number(r.salary))
        .filter(v => !isNaN(v))
        .sort((a, b) => a - b);
      if (salaries.length < 4) return [];
      const q1 = salaries[Math.floor(salaries.length * 0.25)];
      const q3 = salaries[Math.floor(salaries.length * 0.75)];
      const iqr = q3 - q1;
      const lower = q1 - 1.5 * iqr;
      const upper = q3 + 1.5 * iqr;
      return data
        .filter(r => {
          const s = Number(r.salary);
          return !isNaN(s) && (s < lower || s > upper);
        })
        .map(r => r.id);
    }

    default:
      return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const strategy = request.nextUrl.searchParams.get("highlight") || "";
    const data     = await fetchAllEmployees();
    const highlightIds = strategy ? computeHighlights(data, strategy) : [];

    return NextResponse.json(
      { data, highlightIds, strategy },
      {
        headers: {
          "Cache-Control": "public, max-age=0, must-revalidate",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch employees", data: [], highlightIds: [] },
      { status: 500 }
    );
  }
}