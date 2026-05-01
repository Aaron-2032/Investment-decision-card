/**
 * 損益計算函式的單元測試（Unit Tests）
 * 測試對象：calcPnL、calcPnLPct、holdingDays
 * 這些都是純函式（pure functions），不依賴 Firebase 或 React
 * 所以需要用 jest.mock 把 Firebase 模組替換成假的，避免初始化錯誤
 */

import { calcPnL, calcPnLPct, holdingDays } from '@/lib/firestore'
import { Timestamp } from 'firebase/firestore'

// Mock the whole firebase/firestore module so we can use Timestamp in tests
jest.mock('firebase/firestore', () => {
  const actual = jest.requireActual('firebase/firestore')
  return {
    ...actual,
    getFirestore: jest.fn(() => ({})),
    collection: jest.fn(),
    doc: jest.fn(),
    addDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    serverTimestamp: jest.fn(),
    onSnapshot: jest.fn(),
    Timestamp: {
      fromDate: (d: Date) => ({
        toDate: () => d,
        seconds: Math.floor(d.getTime() / 1000),
        nanoseconds: 0,
      }),
      fromMillis: (ms: number) => ({
        toDate: () => new Date(ms),
        seconds: Math.floor(ms / 1000),
        nanoseconds: 0,
      }),
    },
  }
})

// Mock firebase/app and firebase config
jest.mock('@/lib/firebase', () => ({
  db: {},
  auth: {},
  googleProvider: {},
}))

// ── 做多部位、以美元計算倉位大小 ────────────────────────────────────────────────
describe('calcPnL — long position, dollar-denominated', () => {
  it('returns positive P&L when price rises', () => {
    const pnl = calcPnL('long', 100, 120, 1000, 'dollars')
    // shares = 1000 / 100 = 10 ; pnl = (120 - 100) * 10 = 200
    expect(pnl).toBeCloseTo(200)
  })

  it('returns negative P&L when price falls', () => {
    const pnl = calcPnL('long', 100, 80, 1000, 'dollars')
    // shares = 10 ; pnl = (80 - 100) * 10 = -200
    expect(pnl).toBeCloseTo(-200)
  })

  it('returns zero when entry equals exit', () => {
    const pnl = calcPnL('long', 150, 150, 3000, 'dollars')
    expect(pnl).toBeCloseTo(0)
  })
})

describe('calcPnL — long position, share-denominated', () => {
  it('handles share-based sizing correctly', () => {
    const pnl = calcPnL('long', 50, 60, 20, 'shares')
    // pnl = (60 - 50) * 20 = 200
    expect(pnl).toBeCloseTo(200)
  })
})

// ── 做空部位：價格下跌才是盈利 ──────────────────────────────────────────────────
describe('calcPnL — short position', () => {
  it('returns positive P&L when price falls (short gains)', () => {
    const pnl = calcPnL('short', 100, 80, 10, 'shares')
    // raw = (80 - 100) * 10 = -200 ; short → -(-200) = 200
    expect(pnl).toBeCloseTo(200)
  })

  it('returns negative P&L when price rises (short loses)', () => {
    const pnl = calcPnL('short', 100, 130, 10, 'shares')
    // raw = (130 - 100) * 10 = 300 ; short → -300
    expect(pnl).toBeCloseTo(-300)
  })
})

describe('calcPnLPct', () => {
  it('calculates percentage gain for long', () => {
    const pct = calcPnLPct('long', 100, 150)
    expect(pct).toBeCloseTo(50)
  })

  it('calculates percentage loss for long', () => {
    const pct = calcPnLPct('long', 200, 150)
    expect(pct).toBeCloseTo(-25)
  })

  it('inverts for short — price down = gain', () => {
    const pct = calcPnLPct('short', 100, 80)
    // raw = (80 - 100) / 100 * 100 = -20 ; short → +20
    expect(pct).toBeCloseTo(20)
  })

  it('inverts for short — price up = loss', () => {
    const pct = calcPnLPct('short', 100, 120)
    // raw = 20 ; short → -20
    expect(pct).toBeCloseTo(-20)
  })
})

// ── 持有天數計算 ─────────────────────────────────────────────────────────────────
describe('holdingDays', () => {
  it('computes days between entry and exit', () => {
    const entry = Timestamp.fromDate(new Date('2024-01-01'))
    const exit = Timestamp.fromDate(new Date('2024-01-31'))
    expect(holdingDays(entry as any, exit as any)).toBe(30)
  })

  it('uses today when exitDate is null', () => {
    const past = new Date()
    past.setDate(past.getDate() - 7)
    const entry = Timestamp.fromDate(past)
    const days = holdingDays(entry as any, null)
    expect(days).toBeGreaterThanOrEqual(6)
    expect(days).toBeLessThanOrEqual(8)
  })
})
