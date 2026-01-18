import { Currency } from './types'

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  GBP: '£',
  EUR: '€',
  USD: '$',
  CUSTOM: '¤',
}

const CURRENCY_CODES: Record<Currency, string> = {
  GBP: 'GBP',
  EUR: 'EUR',
  USD: 'USD',
  CUSTOM: 'XXX',
}

export function formatCurrency(
  amount: number,
  currency: Currency = 'GBP',
  customFxRate: number = 1
): string {
  // Convert from GBP base if using custom currency
  const displayAmount = currency === 'CUSTOM' ? amount * customFxRate : amount

  const formatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: CURRENCY_CODES[currency] === 'XXX' ? 'GBP' : CURRENCY_CODES[currency],
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  if (currency === 'CUSTOM') {
    const formatted = formatter.format(displayAmount)
    // Replace GBP symbol with custom symbol
    return formatted.replace('£', CURRENCY_SYMBOLS.CUSTOM)
  }

  return formatter.format(displayAmount)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
  }).format(date)
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

export function monthsDifference(startDate: Date, endDate: Date): number {
  const months =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth())
  return Math.max(0, months)
}

export function formatPercent(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`
}

export function formatMonths(months: number): string {
  if (months < 1) return 'Less than 1 month'
  if (months === 1) return '1 month'

  const years = Math.floor(months / 12)
  const remainingMonths = months % 12

  if (years === 0) return `${months} months`
  if (remainingMonths === 0) return years === 1 ? '1 year' : `${years} years`

  const yearStr = years === 1 ? '1 year' : `${years} years`
  const monthStr = remainingMonths === 1 ? '1 month' : `${remainingMonths} months`

  return `${yearStr}, ${monthStr}`
}
