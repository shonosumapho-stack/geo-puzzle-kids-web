export function formatMan(value: number): string {
  return Math.round(value / 10_000).toLocaleString('ja-JP');
}

export function formatRatio(value: number, japan: number): string {
  if (japan <= 0) return '—';
  const ratio = value / japan;
  if (ratio >= 10) return Math.round(ratio).toLocaleString('ja-JP');
  return ratio.toFixed(1);
}
