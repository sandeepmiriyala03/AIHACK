"use client";

import React, { useState } from "react";
import A11yWidget from "@/components/A11yWidget";
// ☝ Adjust the import path to wherever you placed A11yWidget.tsx in your project.
// e.g. "@/components/ui/A11yWidget" or "@/components/A11yWidget"

// ─── Sample page ─────────────────────────────────────────────────────────────
// This is a realistic demo page that intentionally contains common
// accessibility violations (no aria-labels, icon-only buttons, clickable divs,
// images without alt, etc.) so that yuktai-a11y / wcagPlugin has real work to do
// when the user clicks "Apply settings" in the widget.

export default function SamplePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [liked, setLiked] = useState(false);

  return (
    <>
      {/* ── Page content ─────────────────────────────────────── */}
      <div
        style={{
          minHeight: "100vh",
          background: "#f8fafc",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#0f172a",
        }}
      >
        {/* Nav */}
        <nav
          style={{
            background: "#0f172a",
            padding: "0 2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 60,
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <span
            style={{ color: "#5eead4", fontWeight: 700, fontSize: 18, letterSpacing: "-0.01em" }}
          >
            yuktai<span style={{ color: "#fff" }}>.ai</span>
          </span>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* ❌ Icon-only button — no aria-label. wcagPlugin will fix this. */}
            <button
              style={{
                background: "none",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 8,
                padding: "6px 10px",
                cursor: "pointer",
                color: "#94a3b8",
                fontSize: 16,
              }}
              onClick={() => setMenuOpen((v) => !v)}
            >
              ☰
            </button>

            {/* ❌ Anchor used as button, no href, no role — wcagPlugin will fix. */}
            <a
              style={{
                padding: "7px 16px",
                background: "#0d9488",
                color: "#fff",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
              }}
              onClick={() => alert("Sign up clicked")}
            >
              Sign up free
            </a>
          </div>
        </nav>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div
            style={{
              background: "#1e293b",
              padding: "12px 2rem",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {["Features", "Pricing", "Docs", "Blog"].map((item) => (
              <a
                key={item}
                style={{ color: "#94a3b8", cursor: "pointer", fontSize: 14 }}
                onClick={() => setMenuOpen(false)}
              >
                {item}
              </a>
            ))}
          </div>
        )}

        {/* Hero */}
        <section
          style={{
            maxWidth: 860,
            margin: "0 auto",
            padding: "5rem 2rem 3rem",
            textAlign: "center",
          }}
        >
          {/* ❌ Decorative image — no alt attribute. wcagPlugin will fix. */}
          <img
            src="https://placehold.co/80x80/0d9488/ffffff?text=A11y"
            style={{ borderRadius: 16, marginBottom: 24 }}
          />

          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 800,
              margin: "0 0 16px",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
            }}
          >
            Accessibility, on{" "}
            <span style={{ color: "#0d9488" }}>autopilot</span>
          </h1>
          <p
            style={{
              fontSize: 18,
              color: "#475569",
              maxWidth: 540,
              margin: "0 auto 2.5rem",
              lineHeight: 1.7,
            }}
          >
            Drop in one component. yuktai-a11y fixes WCAG violations automatically
            — labels, roles, keyboard access, screen reader support. Zero rewrites.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              style={{
                padding: "12px 28px",
                background: "#0d9488",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Get started
            </button>

            {/* ❌ Empty button — no visible text, no aria-label. wcagPlugin will fix. */}
            <button
              title="View on GitHub"
              style={{
                padding: "12px 20px",
                background: "#fff",
                color: "#0f172a",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                fontSize: 20,
                cursor: "pointer",
              }}
            >
              {/* intentionally empty — icon would go here */}
            </button>
          </div>
        </section>

        {/* Feature cards */}
        <section style={{ maxWidth: 860, margin: "0 auto", padding: "2rem 2rem 4rem" }}>
          <h2
            style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, textAlign: "center" }}
          >
            What gets fixed automatically
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
            }}
          >
            {[
              { icon: "🏷️", title: "ARIA labels",       desc: "Inputs, buttons & links get aria-label from context" },
              { icon: "⌨️", title: "Keyboard access",   desc: "Clickable divs get role, tabIndex & key handlers"   },
              { icon: "🖼️", title: "Image alt text",    desc: "Decorative images get alt='' + aria-hidden"         },
              { icon: "📢", title: "Live region",        desc: "aria-live announcer auto-created for dynamic content" },
              { icon: "🔁", title: "DOM observer",       desc: "MutationObserver re-applies fixes on new nodes"     },
              { icon: "🎨", title: "Visual options",     desc: "High contrast & reduce motion on demand"            },
            ].map((f) => (
              /* ❌ Clickable div — no role, no tabIndex. wcagPlugin will fix. */
              <div
                key={f.title}
                onClick={() => {}}
                style={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: "20px 18px",
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#0d9488")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
              >
                <div style={{ fontSize: 24, marginBottom: 10 }}>{f.icon}</div>
                <p style={{ margin: "0 0 6px", fontWeight: 600, fontSize: 14 }}>{f.title}</p>
                <p style={{ margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Blog-style content section */}
        <section
          style={{
            maxWidth: 680,
            margin: "0 auto",
            padding: "0 2rem 4rem",
          }}
        >
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            Why accessibility can't wait
          </h2>
          <p style={{ color: "#475569", lineHeight: 1.8, marginBottom: 16 }}>
            Over <strong>1 billion people</strong> live with some form of disability. Yet 98% of
            the top million websites fail basic WCAG checks. Most developers skip
            accessibility not because they don't care — but because it requires deep
            ARIA knowledge and constant vigilance.
          </p>
          <p style={{ color: "#475569", lineHeight: 1.8, marginBottom: 24 }}>
            yuktai-a11y eliminates the most common violations automatically. Drop
            in the widget, click Apply, and your page immediately becomes more
            usable for screen-reader users, keyboard-only users, and anyone who
            relies on assistive technology.
          </p>

          {/* Social actions row */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {/* ❌ Clickable div — no role. wcagPlugin will fix. */}
            <div
              onClick={() => setLiked((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 99,
                border: "1px solid #e2e8f0",
                cursor: "pointer",
                fontSize: 13,
                background: liked ? "#f0fdfa" : "#fff",
                color: liked ? "#0d9488" : "#64748b",
              }}
            >
              <span>{liked ? "♥" : "♡"}</span>
              {liked ? "Liked" : "Like this"}
            </div>
            <div
              onClick={() => navigator.clipboard?.writeText(window.location.href)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 99,
                border: "1px solid #e2e8f0",
                cursor: "pointer",
                fontSize: 13,
                color: "#64748b",
                background: "#fff",
              }}
            >
              <span>🔗</span> Share
            </div>
          </div>
        </section>

        {/* Contact form */}
        <section
          style={{
            maxWidth: 560,
            margin: "0 auto",
            padding: "0 2rem 6rem",
          }}
        >
          <div
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: "2rem",
            }}
          >
            <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700 }}>
              Get early access
            </h2>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: "#64748b" }}>
              We'll send you the npm package link when it's ready.
            </p>

            {submitted ? (
              <div
                role="alert"
                style={{
                  padding: "14px 18px",
                  background: "#f0fdfa",
                  border: "1px solid #99f6e4",
                  borderRadius: 10,
                  fontSize: 14,
                  color: "#0f766e",
                  fontWeight: 500,
                }}
              >
                ✓ You're on the list! We'll be in touch soon.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* ❌ input — no aria-label, no <label> linked. wcagPlugin will fix. */}
                <input
                  type="text"
                  placeholder="Your name"
                  style={{
                    padding: "10px 14px",
                    border: "1px solid #e2e8f0",
                    borderRadius: 9,
                    fontSize: 14,
                    outline: "none",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />

                {/* ❌ email input — no aria-label. wcagPlugin will fix. */}
                <input
                  type="email"
                  placeholder="you@example.com"
                  required
                  style={{
                    padding: "10px 14px",
                    border: "1px solid #e2e8f0",
                    borderRadius: 9,
                    fontSize: 14,
                    outline: "none",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />

                {/* ❌ select — no aria-label. wcagPlugin will fix. */}
                <select
                  style={{
                    padding: "10px 14px",
                    border: "1px solid #e2e8f0",
                    borderRadius: 9,
                    fontSize: 14,
                    width: "100%",
                    background: "#fff",
                  }}
                >
                  <option value="">How did you hear about us?</option>
                  <option>Twitter / X</option>
                  <option>GitHub</option>
                  <option>Word of mouth</option>
                  <option>Search engine</option>
                </select>

                {/* ❌ textarea — no aria-label. wcagPlugin will fix. */}
                <textarea
                  placeholder="Anything you'd like us to know? (optional)"
                  rows={3}
                  style={{
                    padding: "10px 14px",
                    border: "1px solid #e2e8f0",
                    borderRadius: 9,
                    fontSize: 14,
                    resize: "vertical",
                    fontFamily: "inherit",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />

                <button
                  onClick={() => setSubmitted(true)}
                  style={{
                    padding: "11px 0",
                    background: "#0d9488",
                    color: "#fff",
                    border: "none",
                    borderRadius: 9,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Request access
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Table — no <th>, wcagPlugin will add role="grid" */}
        <section style={{ maxWidth: 860, margin: "0 auto", padding: "0 2rem 6rem" }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>
            Comparison
          </h2>
          {/* ❌ Table with no <th> — wcagPlugin will add role="grid". */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <tbody>
              {[
                ["Feature",          "yuktai-a11y",  "Manual ARIA",   "axe-core"],
                ["Zero config",      "✓",            "✗",             "✗"       ],
                ["Auto DOM fixes",   "✓",            "✗",             "✗"       ],
                ["MutationObserver", "✓",            "✗",             "✗"       ],
                ["Detailed report",  "✓",            "—",             "✓"       ],
                ["Color contrast",   "—",            "✓",             "✓"       ],
              ].map((row, i) => (
                <tr
                  key={i}
                  style={{ background: i % 2 === 0 ? "#f8fafc" : "#fff" }}
                >
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      style={{
                        padding: "10px 16px",
                        borderBottom: "1px solid #f1f5f9",
                        fontWeight: i === 0 || j === 0 ? 600 : 400,
                        color: cell === "✓" ? "#0d9488" : cell === "✗" ? "#f87171" : "#0f172a",
                      }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Footer */}
        <footer
          style={{
            background: "#0f172a",
            padding: "2rem",
            textAlign: "center",
            fontSize: 13,
            color: "#475569",
          }}
        >
          <p style={{ margin: 0 }}>
            Built with{" "}
            <span style={{ color: "#0d9488", fontWeight: 600 }}>yuktai-a11y</span>{" "}
            — Zero-config WCAG for React · Next.js · Angular
          </p>
          <p style={{ margin: "6px 0 0" }}>
            Open the{" "}
            <span style={{ color: "#5eead4" }}>♿ widget</span>{" "}
            (bottom-right) and click Apply to see all violations fixed live.
          </p>
        </footer>
      </div>

      {/* ── A11yWidget — renders the floating button + panel ─── */}
      {/* Place this once here (or in app/layout.tsx for site-wide coverage). */}
      <A11yWidget />
    </>
  );
}