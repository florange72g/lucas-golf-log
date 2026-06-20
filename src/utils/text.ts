export function parseBulletList(text: string): string[] {
  return text
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, ''));
}
