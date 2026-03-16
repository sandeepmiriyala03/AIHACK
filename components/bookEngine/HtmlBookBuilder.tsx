"use client";

export default function HtmlBookBuilder() {
  return null;
}

// -------- BOOK HTML BUILDER ENGINE (WITH VEDIC CSS) -------- //
export function buildHtmlBook(title: string, pages: string[]) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${title}</title>

<style>
  body {
    font-family: "Noto Sans Telugu", serif;
    padding: 40px;
    line-height: 2;
    font-size: 22px;
  }

  h1 {
    text-align: center;
    margin-bottom: 40px;
  }
  .page {
    margin-bottom: 40px;
    padding-bottom: 30px;
    border-bottom: 1px dashed #bbb;
  }

  /* ---- VEDIC HIGH PITCH ---- */
  .hp-wrap {
    position: relative;
    display: inline-block;
    padding: 0 1px;
  }
  .hp-wrap::before {
    content: "|";
    position: absolute;
    top: -26px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 23px;
  }

  /* ---- VEDIC LOW PITCH ---- */
  .lp-wrap {
    position: relative;
    display: inline-block;
    padding: 0 1px;
  }
  .lp-wrap::after {
    content: "‾";
    position: absolute;
    bottom: -14px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 22px;
  }
</style>
</head>

<body>
<h1>${title}</h1>

${pages
  .map(
    (p, i) => `
      <div class="page">
        <h2>Page ${i + 1}</h2>
        <div>${p.replace(/\n/g, "<br/>")}</div>
      </div>
    `
  )
  .join("")}

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
