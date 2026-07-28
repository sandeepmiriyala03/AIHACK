"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
/* ============================================================
   Local, rule-based C#/.NET code reviewer — Next.js version.
   Same logic as the standalone HTML tool: pure regex checks,
   100% client-side, zero network calls, code never leaves the
   browser. Drop this file in as app/<route>/page.tsx in any
   Next.js (App Router) project.
   ============================================================ */

type Severity = "bug" | "security" | "naming" | "style";

interface Issue {
  severity: Severity;
  line: number;
  description: string;
}

interface Rule {
  id: string;
  severity: Severity;
  pattern: RegExp;
  description: string;
}

const SEVERITY_COLORS: Record<Severity, string> = {
  bug: "#dc2626",
  security: "#991b1b",
  naming: "#0891b2",
  style: "#6b7280",
};

const RULES: Rule[] = [
  {
    id: "hardcoded-connection-string",
    severity: "security",
    pattern: /["']\s*(Server|Data Source)\s*=\s*[^"']*(Password|Pwd)\s*=\s*[^"']+["']/gi,
    description:
      "Hardcoded connection string with a password — move to configuration (appsettings.json + user secrets, or a vault), never commit credentials in source.",
  },
  {
    id: "hardcoded-secret",
    severity: "security",
    pattern: /\b(apiKey|secret|password|connectionString)\s*=\s*"[^"]{8,}"/gi,
    description: "Possible hardcoded secret/credential in source code.",
  },
  {
    id: "sql-concatenation",
    severity: "security",
    pattern: /"(SELECT|INSERT|UPDATE|DELETE)[^"]*"\s*\+/gi,
    description:
      "SQL string built via concatenation — classic SQL injection risk. Use parameterized queries (SqlParameter) or an ORM instead.",
  },
  {
    id: "async-void",
    severity: "bug",
    pattern: /\basync\s+void\s+\w+\s*\(/g,
    description:
      "'async void' method — exceptions here can crash the process and can't be awaited. Use 'async Task' unless this is a genuine event handler.",
  },
  {
    id: "blocking-async-call",
    severity: "bug",
    pattern: /\.(Result|Wait\(\))\b/g,
    description:
      "Blocking on async code (.Result or .Wait()) can cause deadlocks, especially in ASP.NET. Use 'await' instead.",
  },
  {
    id: "empty-catch",
    severity: "bug",
    pattern: /catch\s*(\([^)]*\))?\s*\{\s*\}/g,
    description:
      "Empty catch block — silently swallowing exceptions hides real problems. At minimum, log the exception.",
  },
  {
    id: "generic-exception-catch",
    severity: "style",
    pattern: /catch\s*\(\s*Exception\s+\w+\s*\)/g,
    description: "Catching the generic 'Exception' type — consider catching a more specific exception type where possible.",
  },
  {
    id: "missing-using-disposable",
    severity: "bug",
    pattern: /new\s+(SqlConnection|StreamReader|StreamWriter|FileStream|HttpClient)\s*\([^)]*\)\s*;/g,
    description:
      "IDisposable object created without 'using' — may leak resources. Wrap in a 'using' statement or declaration.",
  },
  {
    id: "public-field-naming",
    severity: "naming",
    pattern: /public\s+(?!class|static\s+class|interface|readonly\s+static|const)\w+\s+[a-z]\w*\s*[;=]/g,
    description:
      "Public field starts with lowercase — company C# conventions typically require PascalCase for public members.",
  },
  {
    id: "interface-naming",
    severity: "naming",
    pattern: /\binterface\s+(?!I[A-Z])\w+/g,
    description:
      "Interface name doesn't start with 'I' — per Microsoft's official Identifier Names guidance (learn.microsoft.com/dotnet/csharp/fundamentals/coding-style/identifier-names).",
  },
  {
    id: "attribute-suffix",
    severity: "naming",
    pattern: /class\s+(?!.*Attribute\b)\w+\s*:\s*Attribute\b/g,
    description: "Class derives from Attribute but its name doesn't end in 'Attribute' — official Microsoft convention requires this suffix.",
  },
  {
    id: "single-letter-name",
    severity: "style",
    pattern: /\b(?:int|string|var|double|float|bool)\s+[a-hj-zA-HJ-Z]\s*[=;,)]/g,
    description:
      "Single-letter variable name (not a loop counter like i/j/k) — Microsoft's guidance recommends avoiding these except for simple loop counters.",
  },
  {
    id: "console-writeline",
    severity: "style",
    pattern: /Console\.WriteLine\s*\(/g,
    description: "Console.WriteLine left in — fine for a console app, but check this isn't debug output left in a library/service.",
  },
  {
    id: "todo-comment",
    severity: "style",
    pattern: /\/\/\s*TODO/gi,
    description: "TODO comment found — worth tracking in your issue tracker rather than leaving indefinitely in source.",
  },
];

function lineNumberOf(code: string, index: number): number {
  return code.slice(0, index).split("\n").length;
}

function runLocalReview(code: string): Issue[] {
  const issues: Issue[] = [];

  RULES.forEach((rule) => {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(code)) !== null) {
      issues.push({
        severity: rule.severity,
        line: lineNumberOf(code, match.index),
        description: rule.description,
      });
    }
  });

  return issues.sort((a, b) => a.line - b.line);
}

export default function DotnetCodeReviewPage() {
  const [code, setCode] = useState("");
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [summary, setSummary] = useState("");

  const handleReview = () => {
    if (!code.trim()) {
      setSummary("Paste some C# code first.");
      setIssues(null);
      return;
    }

    const found = runLocalReview(code);
    setIssues(found);
    setSummary(
      found.length
        ? `Found ${found.length} item(s) — reviewed entirely in your browser, nothing was sent anywhere.`
        : "No issues found by these rules — reviewed entirely in your browser, nothing was sent anywhere."
    );
  };

  return (
    <>
   
    <Navbar />
    <div style={{ maxWidth: 900, margin: "30px auto", padding: "0 20px", fontFamily: "Consolas, Arial, sans-serif" }}>
      <h1 style={{ fontSize: 20, color: "#1e3a8a" }}>🧪 .NET Code Review — Local Rules Only</h1>

      <div
        style={{
          fontSize: 13,
          color: "#16a34a",
          background: "#ecfdf5",
          border: "1px solid #a7f3d0",
          padding: "8px 12px",
          borderRadius: 6,
          marginBottom: 14,
        }}
      >
        🔒 Everything runs in this browser tab. Nothing is uploaded, sent to any API, or saved anywhere.
      </div>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Paste your C# code here..."
        style={{
          width: "100%",
          height: 320,
          boxSizing: "border-box",
          fontFamily: "Consolas, monospace",
          fontSize: 13,
          padding: 10,
          border: "1px solid #ccc",
          borderRadius: 6,
        }}
      />

      <br />

      <button
        onClick={handleReview}
        style={{
          marginTop: 10,
          padding: "10px 20px",
          background: "#1e3a8a",
          color: "white",
          border: "none",
          borderRadius: 6,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Review Code
      </button>

      {summary && (
        <div style={{ marginTop: 16, fontStyle: "italic", color: "#333" }}>{summary}</div>
      )}

      {issues?.map((issue, i) => {
        const color = SEVERITY_COLORS[issue.severity];
        return (
          <div
            key={i}
            style={{
              marginTop: 8,
              padding: 10,
              borderLeft: `4px solid ${color}`,
              background: "white",
              borderRadius: "0 6px 6px 0",
              fontSize: 13,
            }}
          >
            <span
              style={{
                fontWeight: 700,
                textTransform: "uppercase",
                fontSize: 10,
                marginRight: 8,
                padding: "2px 6px",
                borderRadius: 4,
                color: "white",
                background: color,
              }}
            >
              {issue.severity}
            </span>
            <strong>Line {issue.line}:</strong> {issue.description}
          </div>
        );
      })}
    </div>
    </>
  );
}