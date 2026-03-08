export function formatCoins(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '0';
  }

  // Integer → return without decimals
  if (Number.isInteger(value)) {
    return String(value);
  }

  const truncated = Math.trunc(value * 100) / 100;

  return truncated
    .toFixed(2)
    .replace(/\.?0+$/, '');
}
