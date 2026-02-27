"use client";

export type PagePreview = {
  pageNumber: number;
  snippet: string;
  fullText: string;
};

export function generatePagePreviews(pages: string[]): PagePreview[] {
  return pages.map((text, i) => ({
    pageNumber: i + 1,
    snippet: text.substring(0, 60) + "...",
    fullText: text,
  }));
}

export default function PagePreviewer() {
  return null; // UI will be in OCR Engine page
}
