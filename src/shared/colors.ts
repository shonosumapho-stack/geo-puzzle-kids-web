/** Android PrefectureCatalog / MunicipalityCatalog と同じ色相 */
export function colorForCode(code: string): string {
  const n = parseInt(code, 10);
  const hue = (n * 37) % 360;
  return `hsl(${hue} 45% 55%)`;
}
