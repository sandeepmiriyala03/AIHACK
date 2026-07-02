import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      "https://yuktishaalaa-ai.vercel.app/employee/employees",
      { cache: "no-store" }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}