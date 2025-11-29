"use client";

// This component has no UI, it only provides export logic.
export default function JsonExporter() {
  return null;
}

/**
 * Export any JSON-serializable data as a downloadable .json file
 * @param data – strongly typed generic value
 * @param filename – file name without extension
 */
export function exportJson<T>(data: T, filename: string): void {
  const jsonString = JSON.stringify(data, null, 2);

  const blob = new Blob([jsonString], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = `${filename}.json`;
  a.click();

  URL.revokeObjectURL(url);
}
