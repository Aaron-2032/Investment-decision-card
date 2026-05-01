/**
 * 格式化工具函式的單元測試
 * 測試對象：formatCurrency、formatPct、formatDate、toDateInputValue、fromDateInputValue
 * 這些都是純函式，測試非常直觀：輸入 → 期望輸出
 */

import { formatCurrency, formatPct, formatDate, toDateInputValue, fromDateInputValue } from '@/lib/utils'

describe('formatCurrency', () => {
  it('formats positive number with USD symbol', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56')
  })

  it('formats negative number', () => {
    expect(formatCurrency(-500)).toBe('-$500.00')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })

  it('rounds to 2 decimal places', () => {
    expect(formatCurrency(1.999)).toBe('$2.00')
  })
})

describe('formatPct', () => {
  it('adds + sign for positive values', () => {
    expect(formatPct(12.34)).toBe('+12.34%')
  })

  it('shows negative sign for negative values', () => {
    expect(formatPct(-5.5)).toBe('-5.50%')
  })

  it('formats zero as +0.00%', () => {
    expect(formatPct(0)).toBe('+0.00%')
  })
})

describe('formatDate', () => {
  it('returns em-dash for null', () => {
    expect(formatDate(null)).toBe('—')
  })

  it('formats a valid date', () => {
    const date = new Date('2024-06-15T12:00:00')
    const result = formatDate(date)
    expect(result).toContain('Jun')
    expect(result).toContain('15')
    expect(result).toContain('2024')
  })
})

describe('toDateInputValue / fromDateInputValue', () => {
  it('round-trips a date through the input format', () => {
    const original = new Date('2024-03-20T00:00:00')
    const str = toDateInputValue(original)
    expect(str).toBe('2024-03-20')
    const parsed = fromDateInputValue(str)
    expect(parsed.getFullYear()).toBe(2024)
    expect(parsed.getMonth()).toBe(2) // 0-indexed
    expect(parsed.getDate()).toBe(20)
  })
})
