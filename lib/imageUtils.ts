// =====================================================
// AksharaChitra — Image Utilities (Next.js safe)
// =====================================================

/**
 * Returns the optimal max dimension for image resize
 * based on the current device viewport and memory hints.
 */
export function getOptimalImageSize(): number {
  if (typeof window === "undefined") return 2000;
  const w = window.innerWidth;
  const mem = (navigator as { deviceMemory?: number }).deviceMemory ?? 4;
  if (w < 480) return 1200;
  if (w < 768) return 1600;
  if (w < 1024) return 2000;
  if (mem < 4) return 2400;
  return 3000;
}

/**
 * Resizes an image File to a max dimension while preserving aspect ratio.
 * Returns a base64 JPEG data URL.
 */
export function resizeImageBeforeCrop(
  file: File,
  maxDimension: number = 2000
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image"));
      img.onload = () => {
        let { width, height } = img;
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.92));
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Validates an uploaded image file (type + size).
 * Returns an error string or null if valid.
 */
export function validateImageFile(
  file: File,
  maxMB = 20
): string | null {
  if (!file.type.match(/^image\/(jpeg|jpg|png|webp|gif)/i)) {
    return "Please upload a valid image file (JPG, PNG, WEBP, GIF)";
  }
  if (file.size > maxMB * 1024 * 1024) {
    return `Image too large! Please upload an image under ${maxMB}MB`;
  }
  return null;
}

/**
 * Generates a filename from the poster title + dimensions.
 */
export function formatFilename(base: string, w: number, h: number): string {
  const clean = (base || "AksharaChitra").replace(/[^\w\- ]/g, "").slice(0, 40);
  return `${clean}_${w}x${h}.png`;
}

/**
 * Formats the current timestamp in en-IN locale for poster footers.
 */
export function getFormattedTimestamp(): string {
  return new Date()
    .toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .replace(",", "");
}

/**
 * Downloads a data URL as a PNG file.
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Shares a poster image via Web Share API or falls back to download.
 */
export async function sharePosterDataUrl(
  dataUrl: string,
  title: string
): Promise<"shared" | "downloaded" | "error"> {
  try {
    const resp = await fetch(dataUrl);
    const blob = await resp.blob();
    const file = new File([blob], "AksharaChitra_Poster.png", {
      type: blob.type,
    });

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: title || "AksharaChitra Poster 🎨",
        text: "Created with AksharaChitra — Multilingual Poster Maker 🌸",
      });
      return "shared";
    }

    downloadDataUrl(dataUrl, "AksharaChitra_Poster.png");
    return "downloaded";
  } catch {
    return "error";
  }
}
