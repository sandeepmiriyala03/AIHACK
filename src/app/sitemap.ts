import type { MetadataRoute } from "next";
import { PAGES, absoluteUrl } from "@/lib/site-content";

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.filter((p) => p.listed).map((p) => ({
    url: absoluteUrl(p.href),
    changeFrequency: "monthly",
    priority: p.href === "/" ? 1 : 0.7,
  }));
}
