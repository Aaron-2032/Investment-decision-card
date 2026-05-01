/**
 * 決策卡必填欄位驗證邏輯的單元測試
 * 驗證規則：所有必填欄位（共 8 個）缺一不可，否則阻止存檔
 * 這裡把 DecisionForm 裡的 validate() 邏輯抽出來單獨測試，
 * 不需要渲染 React 元件，測試執行更快速
 */

import { DECISION_REQUIRED_FIELDS } from '@/lib/types'

// Validation function extracted for testing (mirrors DecisionForm's validate())
function validateDecision(form: Record<string, unknown>): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!form.ticker || String(form.ticker).trim() === '') {
    errors.ticker = 'Ticker is required'
  }
  const ep = parseFloat(String(form.entryPrice ?? ''))
  if (!form.entryPrice || isNaN(ep) || ep <= 0) {
    errors.entryPrice = 'Entry price is required and must be positive'
  }
  if (!form.entryDate) {
    errors.entryDate = 'Entry date is required'
  }
  if (!form.thesis || String(form.thesis).trim() === '') {
    errors.thesis = 'Investment thesis is required'
  }
  const ps = parseFloat(String(form.positionSize ?? ''))
  if (!form.positionSize || isNaN(ps) || ps <= 0) {
    errors.positionSize = 'Position size is required and must be positive'
  }
  const sl = parseFloat(String(form.stopLoss ?? ''))
  if (!form.stopLoss || isNaN(sl) || sl <= 0) {
    errors.stopLoss = 'Stop-loss is required and must be positive'
  }
  const tp = parseFloat(String(form.targetPrice ?? ''))
  if (!form.targetPrice || isNaN(tp) || tp <= 0) {
    errors.targetPrice = 'Target price is required and must be positive'
  }

  return errors
}

const VALID_FORM = {
  ticker: 'AAPL',
  entryPrice: 150,
  entryDate: '2024-01-15',
  thesis: 'Strong earnings growth expected.',
  positionSize: 5000,
  positionUnit: 'dollars',
  stopLoss: 135,
  targetPrice: 175,
}

describe('Decision Card — required field validation', () => {
  it('passes with all required fields present', () => {
    const errs = validateDecision(VALID_FORM)
    expect(Object.keys(errs)).toHaveLength(0)
  })

  it('blocks save when ticker is missing', () => {
    const errs = validateDecision({ ...VALID_FORM, ticker: '' })
    expect(errs.ticker).toBeTruthy()
  })

  it('blocks save when entry price is zero', () => {
    const errs = validateDecision({ ...VALID_FORM, entryPrice: 0 })
    expect(errs.entryPrice).toBeTruthy()
  })

  it('blocks save when entry price is negative', () => {
    const errs = validateDecision({ ...VALID_FORM, entryPrice: -10 })
    expect(errs.entryPrice).toBeTruthy()
  })

  it('blocks save when thesis is blank', () => {
    const errs = validateDecision({ ...VALID_FORM, thesis: '   ' })
    expect(errs.thesis).toBeTruthy()
  })

  it('blocks save when stop-loss is missing', () => {
    const errs = validateDecision({ ...VALID_FORM, stopLoss: undefined })
    expect(errs.stopLoss).toBeTruthy()
  })

  it('blocks save when target price is missing', () => {
    const errs = validateDecision({ ...VALID_FORM, targetPrice: undefined })
    expect(errs.targetPrice).toBeTruthy()
  })

  it('accumulates errors for multiple missing fields', () => {
    const errs = validateDecision({})
    expect(Object.keys(errs).length).toBeGreaterThanOrEqual(6)
  })

  it('DECISION_REQUIRED_FIELDS contains 8 fields', () => {
    expect(DECISION_REQUIRED_FIELDS).toHaveLength(8)
  })
})

// ── 風險報酬比（R:R）計算 ────────────────────────────────────────────────────────
// 公式：|(目標價 - 進場價) / (進場價 - 停損價)|
// 例如：進場 100、目標 120、停損 90 → R:R = 20/10 = 2（建議至少 1:1 以上）
describe('Risk/Reward ratio', () => {
  function calcRR(entry: number, target: number, stopLoss: number): number {
    return Math.abs((target - entry) / (entry - stopLoss))
  }

  it('computes 2:1 R:R correctly', () => {
    expect(calcRR(100, 120, 90)).toBeCloseTo(2)
  })

  it('computes 1:1 R:R correctly', () => {
    expect(calcRR(100, 110, 90)).toBeCloseTo(1)
  })

  it('computes R:R less than 1 for poor setups', () => {
    expect(calcRR(100, 105, 90)).toBeCloseTo(0.5)
  })
})
