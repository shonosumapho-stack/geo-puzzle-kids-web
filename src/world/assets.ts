/** Android: world/{path}.jpg */
export function worldImageUrl(assetPath: string): string {
  if (!assetPath) return '';
  return `/assets/world/${assetPath}.jpg`;
}
