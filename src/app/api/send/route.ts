/**
 * app/api/send/route.ts
 * Vercel serverless API — sends WhatsApp message via Meta Cloud API
 */

import { NextRequest, NextResponse } from "next/server";

const WA_TOKEN    = process.env.WA_TOKEN!;        // Meta permanent token
const WA_PHONE_ID = process.env.WA_PHONE_ID!;     // Phone Number ID from Meta dashboard
const WA_API_URL  = `https://graph.facebook.com/v19.0/${WA_PHONE_ID}/messages`;

export async function POST(req: NextRequest) {
  try {
    const { phone, message } = await req.json();

    if (!phone || !message) {
      return NextResponse.json({ error: "phone and message are required." }, { status: 400 });
    }

    // Clean phone — digits only, no + or spaces
    const cleanPhone = String(phone).replace(/\D/g, "");

    const body = {
      messaging_product: "whatsapp",
      to: cleanPhone,
      type: "text",
      text: { body: message },
    };

    const res = await fetch(WA_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WA_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Meta API error:", data);
      return NextResponse.json({ error: data?.error?.message ?? "Meta API error." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, messageId: data?.messages?.[0]?.id });

  } catch (err: any) {
    console.error("Send route error:", err);
    return NextResponse.json({ error: err.message ?? "Server error." }, { status: 500 });
  }
}