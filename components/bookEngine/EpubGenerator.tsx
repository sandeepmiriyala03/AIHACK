"use client";

import JSZip from "jszip";

export default function EpubGenerator() {
  return null;
}

// Generate proper EPUB structure (minimal valid EPUB 3.0)
export async function generateEpub(title: string, pages: string[]): Promise<Blob> {
  const zip = new JSZip();

  // 1. mimetype file (required first in EPUB)
  zip.file("mimetype", "application/epub+zip", { compression: false });

  // 2. META-INF/container.xml (required)
  zip.file("META-INF/container.xml", `<?xml version="1.0"?>
  tainer version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
    <rootfiles>
      <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
    </rootfiles>
  </container>`);

  // 3. OEBPS/content.opf (package metadata)
  const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
  <package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="3.0">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
      <dc:title>${title}</dc:title>
      <dc:language>en</dc:language>
      <dc:identifier id="bookid">urn:uuid:aksharatantra-${Date.now()}</dc:identifier>
    </metadata>
    <manifest>
      <item id="ncx" href="OEBPS/nav.ncx" media-type="application/x-dtbncx+xml"/>
      <item id="content" href="OEBPS/content.xhtml" media-type="application/xhtml+xml"/>
      <item id="ncx-file" href="OEBPS/nav.ncx" media-type="application/x-dtbncx+xml"/>
      <item id="opf-style" href="OEBPS/style.css" media-type="text/css"/>
    </manifest>
    <spine toc="ncx">
      <itemref idref="content"/>
    </spine>
  </package>`;

  // 4. OEBPS/content.xhtml (main content)
  const safePages = pages.map(p => p.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
  const contentXhtml = `<?xml version="1.0" encoding="UTF-8"?>
  <!DOCTYPE html>
  <html xmlns="http://www.w3.org/1999/xhtml">
  <head><title>${title}</title></head>
  <body>
    <h1>${title}</h1>
    ${safePages.map((p, i) => `<div class="page"><h2>Page ${i+1}</h2><p>${p.replace(/\n/g, "<br/>")}</p></div>`).join("")}
  </body>
  </html>`;

  // 5. OEBPS/nav.ncx (table of contents)
  zip.file("OEBPS/nav.ncx", `<?xml version="1.0" encoding="UTF-8"?>
  <ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
    <head><meta name="dtb:uid" content="urn:uuid:aksharatantra-${Date.now()}"/></head>
    <docTitle><text>${title}</text></docTitle>
    <navMap><navPoint id="navpoint-1"><navLabel><text>Content</text></navLabel>tent src="content.xhtml"/></navPoint></navMap>
  </ncx>`);

  // 6. OEBPS/style.css
  zip.file("OEBPS/style.css", `body { font-family: serif; line-height: 1.6; margin: 2em; }
  .page { page-break-after: always; margin-bottom: 2em; border-bottom: 1px solid #ccc; }`);

  // Add all files to correct folders
  zip.file("OEBPS/content.opf", contentOpf);
  zip.file("OEBPS/content.xhtml", contentXhtml);

  // Generate valid EPUB blob
  const epubBlob = await zip.generateAsync({ 
    type: "blob", 
    mimeType: "application/epub+zip",
    compression: "DEFLATE"
  });

  return epubBlob;
}
