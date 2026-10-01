export function toCopyText(content: string): string {
  return content.replace(/ ?\[\d+\]/g, "")
}
