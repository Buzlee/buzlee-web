/**
 * Trigger a browser download of in-memory text (CSV exports, templates).
 * BOM-prefixed so Excel detects UTF-8.
 */
export function downloadTextFile(
  fileName: string,
  text: string,
  mimeType = "text/csv;charset=utf-8",
): void {
  const blob = new Blob([`\uFEFF${text}`], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
