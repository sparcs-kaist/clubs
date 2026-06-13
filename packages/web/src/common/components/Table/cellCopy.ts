export function normalizeTableCellCopyText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}
