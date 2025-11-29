"use client";

export default function HtmlBookBuilder() {
  return null; // UI will be handled in OcrEnginePage
}

// --- helper to escape basic HTML chars in page text ---
function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// -------- BOOK HTML BUILDER ENGINE -------- //
export function buildHtmlBook(title: string, pages: string[]) {
  const safeTitle = escapeHtml(title);
  const bodyPages = pages
    .map(
      (p, i) => `
      <div class="page">
        <h2>Page ${i + 1}</h2>
        <p>${escapeHtml(p).replace(/\n/g, "<br/>")}</p>
      </div>`
    )
    .join("");

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${safeTitle}</title>
    <style>
      body { font-family: serif; padding: 40px; line-height: 1.7; }
      h1 { text-align: center; }
      .page { margin-bottom: 40px; border-bottom: 1px dashed #aaa; padding-bottom: 30px; }
    </style>
  </head>
  <body>
    <h1>${safeTitle}</h1>
    ${bodyPages}
  </body>
  </html>
  `;
}

export function downloadHtmlFile(html: string, filename: string) {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.html`;
  a.click();

  URL.revokeObjectURL(url);
}
