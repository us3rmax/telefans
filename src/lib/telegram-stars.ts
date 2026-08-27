export const DISPLAY_STARS_PER_USD = 50

export function starsToUsd(stars: number) {
  const normalized = Number.isFinite(stars) ? Math.max(0, Math.round(stars)) : 0
  return normalized / DISPLAY_STARS_PER_USD
}

export function formatUsdFromStars(stars: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(starsToUsd(stars))
}

export function formatUsdInputFromStars(stars: number) {
  return starsToUsd(stars).toFixed(2)
}

export function usdToStars(usd: number) {
  const normalized = Number.isFinite(usd) ? Math.max(0, usd) : 0
  return Math.max(0, Math.round(normalized * DISPLAY_STARS_PER_USD))
}
