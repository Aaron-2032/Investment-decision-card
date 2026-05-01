// 共用工具函式
// 格式化、樣式合併等與業務邏輯無關的小工具都放在這裡

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// 合併 Tailwind CSS class 名稱，並自動處理衝突（例如 p-2 vs p-4 以後者為準）
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 將數字格式化為貨幣字串，例如 1234.5 → "$1,234.50"
export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

// 格式化百分比，正數加上 + 號，例如 12.3 → "+12.30%"、-5 → "-5.00%"
export function formatPct(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

// 將 Date 物件格式化為易讀字串，null 時顯示 "—"（破折號）
export function formatDate(date: Date | null | undefined): string {
  if (!date) return '—'
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// 將 Date 轉成 <input type="date"> 需要的 "YYYY-MM-DD" 字串格式
export function toDateInputValue(date: Date): string {
  return date.toISOString().split('T')[0]
}

// 將 "YYYY-MM-DD" 字串轉回 Date 物件（加上時區避免日期偏移問題）
export function fromDateInputValue(value: string): Date {
  return new Date(value + 'T00:00:00')
}
