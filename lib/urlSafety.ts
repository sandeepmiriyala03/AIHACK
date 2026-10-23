// lib/urlSafety.ts (server only: uses Node's DNS)
// Accepts only public http(s) websites. Blocks localhost, private networks and
// cloud metadata addresses, so visitors cannot make the server probe internal systems.

import { lookup } from "node:dns/promises";
import net from "node:net";

export function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
      (a === 169 && b === 254) || // link-local, cloud metadata (169.254.169.254)
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19))
    );
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith("::ffff:")) return isPrivateIp(v6.slice(7));
  return v6 === "::" || v6 === "::1" || /^f[cd]/.test(v6) || /^fe[89ab]/.test(v6);
}

export type UrlCheck = { ok: true; url: string } | { ok: false; error: string };

export async function checkUrl(input: unknown, resolve = lookup): Promise<UrlCheck> {
  if (typeof input !== "string" || !input.trim() || input.length > 2000) return { ok: false, error: "Please enter a website address." };
  const text = input.trim();
  // another scheme (ftp:, file:, javascript:, data:…) is refused, not wrapped in https://
  if (/^[a-z][a-z0-9+.-]*:/i.test(text) && !/^https?:\/\//i.test(text) && !/^[^:/]+:\d+(\/|$)/.test(text)) {
    return { ok: false, error: "Only http and https websites can be tested." };
  }
  let u: URL;
  try {
    u = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return { ok: false, error: "That does not look like a website address." };
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return { ok: false, error: "Only http and https websites can be tested." };
  if (u.username || u.password) return { ok: false, error: "Addresses with a username or password are not allowed." };
  if (u.port && u.port !== "80" && u.port !== "443") return { ok: false, error: "Only standard web ports (80, 443) are allowed." };
  const host = u.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "localhost" || /\.(local|internal|localhost)$/.test(host)) return { ok: false, error: "Local and internal addresses cannot be tested." };
  try {
    const addresses = net.isIP(host) ? [{ address: host }] : await resolve(host, { all: true });
    if (!addresses.length || addresses.some((a) => isPrivateIp(a.address))) return { ok: false, error: "Only public websites can be tested." };
  } catch {
    return { ok: false, error: "This website could not be found. Check the address." };
  }
  return { ok: true, url: u.toString() };
}
