// Number / currency formatting helpers.

const usd0 = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function money(n) {
  if (!isFinite(n)) return '—';
  return usd0.format(Math.round(n));
}

// Compact form for very large headline numbers, e.g. $1.2M.
export function moneyCompact(n) {
  if (!isFinite(n)) return '—';
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 10_000) return `$${(n / 1_000).toFixed(0)}K`;
  return money(n);
}

export function percent(n) {
  return `${Number(n).toFixed(n % 1 === 0 ? 0 : 1)}%`;
}

export function years(n) {
  if (n >= 60) return '60+ years';
  return `${n.toFixed(1)} years`;
}
