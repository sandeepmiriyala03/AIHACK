"use client";

import JSZip from "jszip";

export default function EpubGenerator() {
  return null;
}

export async function generateEpub(
  title: string,
  pages: string[],
  filename: string
) {
  const zip = new JSZip();

  const html = `
  <h1>${title}</h1>
  ${pages.map((p) => `<p>${p}</p>`).join("")}
  `;

  zip.file("book.html", html);

  const epubBlob = await zip.generateAsync({ type: "blob" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(epubBlob);
  a.download = `${filename}.epub`;
  a.click();
}
