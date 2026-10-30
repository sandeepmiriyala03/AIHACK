// JSON-LD for the homepage (schema.org): who made AksharaTantra and what it is.
import { PAGES, SITE, absoluteUrl } from "./site-content";

export function homeJsonLd() {
  const person = {
    "@type": "Person",
    "@id": `${SITE.url}/#author`,
    name: SITE.author.name,
    url: SITE.author.url,
    sameAs: [...SITE.author.sameAs],
  };
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE.url}/#website`,
        url: `${SITE.url}/`,
        name: SITE.name,
        description: SITE.description,
        inLanguage: "en",
        publisher: { "@id": `${SITE.url}/#author` },
      },
      {
        "@type": "WebApplication",
        "@id": `${SITE.url}/#app`,
        name: SITE.name,
        url: `${SITE.url}/`,
        description: SITE.description,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any (web browser)",
        browserRequirements: "Requires JavaScript and a modern browser",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
        author: { "@id": `${SITE.url}/#author` },
        codeRepository: SITE.sourceCode,
        image: `${SITE.url}/icon-512.png`,
        featureList: PAGES.filter((p) => p.listed && p.href !== "/").map((p) => `${p.title}: ${p.tagline}`),
        hasPart: PAGES.filter((p) => p.listed && p.href !== "/").map((p) => ({
          "@type": "WebPage",
          name: p.title,
          url: absoluteUrl(p.href),
          description: p.summary,
        })),
      },
      person,
    ],
  };
}

/** JSON safe inside <script>: `<` is escaped so text can't close the tag. */
export const jsonLdScript = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
