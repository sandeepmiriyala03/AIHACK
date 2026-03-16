import { jsPDF } from "jspdf";

/* ----------------------------------------------------------
   GOOGLE FONT URL MAP (fallback for non-Telugu languages)
---------------------------------------------------------- */
const GOOGLE_FONT_URL_MAP: Record<string, string> = {
  ben: "https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansBengali/NotoSansBengali-Regular.ttf",
  asm: "https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansBengali/NotoSansBengali-Regular.ttf",
  guj: "https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansGujarati/NotoSansGujarati-Regular.ttf",
  hin: "https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Regular.ttf",
  mar: "https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Regular.ttf",
  nep: "https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Regular.ttf",
  san: "https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Regular.ttf",
  ori: "https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansOriya/NotoSansOriya-Regular.ttf",
  pan: "https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansGurmukhi/NotoSansGurmukhi-Regular.ttf",
  tam: "https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansTamil/NotoSansTamil-Regular.ttf",
  kan: "https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansKannada/NotoSansKannada-Regular.ttf",
  mal: "https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansMalayalam/NotoSansMalayalam-Regular.ttf",
  urd: "https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansArabic/NotoSansArabic-Regular.ttf",
  ara: "https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansArabic/NotoSansArabic-Regular.ttf",
  jpn: "https://raw.githubusercontent.com/googlefonts/noto-cjk/main/Sans/OTF/Japanese/NotoSansJP-Regular.otf",
  kor: "https://raw.githubusercontent.com/googlefonts/noto-cjk/main/Sans/OTF/Korean/NotoSansKR-Regular.otf",
  chi_sim: "https://raw.githubusercontent.com/googlefonts/noto-cjk/main/Sans/OTF/SimplifiedChinese/NotoSansSC-Regular.otf",
  chi_tra: "https://raw.githubusercontent.com/googlefonts/noto-cjk/main/Sans/OTF/TraditionalChinese/NotoSansTC-Regular.otf",
  tha: "https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansThai/NotoSansThai-Regular.ttf",
  vie: "https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf",
  eng: "https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf",
  fra: "https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf",
  ita: "https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf",
  por: "https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf",
  nld: "https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf",
  spa: "https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf",
  swe: "https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf",
  tur: "https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf",
  rus: "https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf"
};

/* ----------------------------------------------------------
   Load font (Local Telugu + Google rest)
---------------------------------------------------------- */
async function loadFont(language: string, pdf: jsPDF) {
  let fontData: ArrayBuffer;
  let fontName = language + "_font";

  if (language === "tel") {
    // =======================
    // LOCAL TELUGU FONT
    // =======================
    const res = await fetch("fonts/RamaneeyaWin.ttf");
    fontData = await res.arrayBuffer();
    fontName = "Ramaneeya";
  } else {
    // Google fallback
    const url = GOOGLE_FONT_URL_MAP[language] ?? GOOGLE_FONT_URL_MAP["eng"];
    const res = await fetch(url);
    fontData = await res.arrayBuffer();
  }

  const bin = new Uint8Array(fontData);
  const base64 = btoa(bin.reduce((s, b) => s + String.fromCharCode(b), ""));

  pdf.addFileToVFS(`${fontName}.ttf`, base64);
  pdf.addFont(`${fontName}.ttf`, fontName, "normal");

  return fontName;
}

/* ----------------------------------------------------------
   ⭐ FINAL PRO PDF GENERATOR
---------------------------------------------------------- */
export async function generatePdf(title: string, pages: string[], language: string) {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });

  const fontName = await loadFont(language, pdf);
  pdf.setFont(fontName);

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const marginLeft = 60;
  const marginRight = 60;
  const marginTop = 70;
  const marginBottom = 60;

  const maxWidth = pageWidth - marginLeft - marginRight;
  const maxHeight = pageHeight - marginTop - marginBottom;

  const text = pages.join("\n\n");

  /* ----------------------------------------------------------
     Dynamic text fitting (auto-scale font)
  ---------------------------------------------------------- */
  const sizes = [22, 20, 18, 16, 14, 12];
  let chosenSize = 12;
  let chosenLines: string[] = [];

  for (const size of sizes) {
    pdf.setFontSize(size);
    const lines = pdf.splitTextToSize(text, maxWidth);
    const neededHeight = lines.length * size * 1.45;

    if (neededHeight < maxHeight) {
      chosenSize = size;
      chosenLines = lines;
      break;
    }

    chosenLines = lines; // fallback
  }

  /* ----------------------------------------------------------
     Title Page
  ---------------------------------------------------------- */
  pdf.setFontSize(chosenSize + 10);
  pdf.text(title, pageWidth / 2, pageHeight / 3, { align: "center" });

  pdf.setFontSize(chosenSize + 2);
  pdf.text("Generated by AksharaTantra OCR Engine", pageWidth / 2, pageHeight / 3 + 40, {
    align: "center",
  });

  pdf.addPage();

  /* ----------------------------------------------------------
     Header/Footer
  ---------------------------------------------------------- */
  function headerFooter(pageNum: number) {
    pdf.setFontSize(10);
    pdf.text(title, marginLeft, 40);
    pdf.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - 30, { align: "center" });
  }

  /* ----------------------------------------------------------
     Render Content (multi-page)
  ---------------------------------------------------------- */
  let y = marginTop;
  let pageIndex = 1;

  headerFooter(pageIndex);
  pdf.setFontSize(chosenSize);

  for (const line of chosenLines) {
    if (y > pageHeight - marginBottom) {
      pdf.addPage();
      pageIndex++;
      headerFooter(pageIndex);
      y = marginTop;
    }
    pdf.text(line, marginLeft, y);
    y += chosenSize * 1.45;
  }

  return pdf.output("blob");
}
