export function normalizeBlankLines(content: string, maxConsecutive = 1): string {
  const normalizedNewlines = content.replace(/\r\n/g, "\n");
  const collapsePattern = new RegExp(`\\n{${maxConsecutive + 2},}`, "g");
  const collapsed = normalizedNewlines.replace(collapsePattern, "\n".repeat(maxConsecutive + 1));
  return ensureTrailingNewline(collapsed.replace(/[ \t]+\n/g, "\n"));
}

export function ensureTrailingNewline(content: string): string {
  if (content.length === 0) return content;
  return content.endsWith("\n") ? content : `${content}\n`;
}

export function formatFeatureFile(content: string): string {
  return normalizeBlankLines(content, 1);
}

export function formatTypeScriptFile(content: string): string {
  return normalizeBlankLines(content, 1);
}
