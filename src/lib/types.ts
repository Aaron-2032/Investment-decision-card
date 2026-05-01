// 全域型別定義檔
// 所有資料模型都在這裡統一定義，方便整個專案複用並確保型別安全

import { Timestamp } from 'firebase/firestore'

// ─── Decision Card ────────────────────────────────────────────────────────────
// 決策卡：紀錄每一筆投資/交易決策的核心資料結構

// 決策狀態：進行中 / 已平倉 / 已封存
export type DecisionStatus = 'active' | 'closed' | 'archived'
// 部位方向：做多（預期漲）/ 做空（預期跌）
export type PositionDirection = 'long' | 'short'
// 部位大小單位：以美元計 或 以股數計
export type PositionUnit = 'dollars' | 'shares'
// 複盤結果：獲利 / 虧損 / 打平
export type ReviewOutcome = 'win' | 'loss' | 'breakeven'

export interface Decision {
  id: string
  userId: string

  // Required fields — save blocked if any are empty
  ticker: string
  entryPrice: number
  entryDate: Timestamp
  thesis: string
  positionSize: number
  positionUnit: PositionUnit
  stopLoss: number
  targetPrice: number

  // Optional metadata
  companyName: string
  sector: string
  direction: PositionDirection
  tags: string[]
  notes: string

  // Status
  status: DecisionStatus

  // Close fields (populated when a sell is recorded)
  exitPrice: number | null
  exitDate: Timestamp | null

  // Realtime price cache (updated by serverless fn)
  currentPrice: number | null
  lastPriceFetch: Timestamp | null

  // Timestamps
  createdAt: Timestamp
  updatedAt: Timestamp
}

// 建立/更新時使用的輸入型別：去掉由伺服器自動產生的欄位（id、userId、時間戳記等）
export type DecisionInput = Omit<
  Decision,
  'id' | 'userId' | 'createdAt' | 'updatedAt' | 'lastPriceFetch'
>

// 必填欄位清單：存檔前會逐一檢查這些欄位是否有填寫，缺一不可
export const DECISION_REQUIRED_FIELDS: (keyof DecisionInput)[] = [
  'ticker',
  'entryPrice',
  'entryDate',
  'thesis',
  'positionSize',
  'positionUnit',
  'stopLoss',
  'targetPrice',
]

// ─── Review ───────────────────────────────────────────────────────────────────
// 複盤紀錄：每次平倉都必須填寫，包含出場資訊與事後反省

export interface Review {
  id: string
  decisionId: string
  userId: string

  // Sell event details
  exitPrice: number
  exitDate: Timestamp
  outcome: ReviewOutcome

  // Post-mortem
  thesisValidated: boolean
  followedPlan: boolean
  emotionalState: string
  whatWentRight: string
  whatWentWrong: string
  lessonsLearned: string
  rating: number // 1–5

  createdAt: Timestamp
  updatedAt: Timestamp
}

export type ReviewInput = Omit<Review, 'id' | 'userId' | 'createdAt' | 'updatedAt'>

// ─── Quick Note ───────────────────────────────────────────────────────────────
// 快速筆記：可在任何頁面隨時記下想法，並選擇性連結到某張決策卡

export interface QuickNote {
  id: string
  userId: string
  decisionId: string | null  // null = unlinked
  content: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type QuickNoteInput = Omit<QuickNote, 'id' | 'userId' | 'createdAt' | 'updatedAt'>

// ─── Computed helpers ─────────────────────────────────────────────────────────
// 計算結果的資料結構：由 entryPrice、currentPrice/exitPrice 推導出的損益摘要

export interface PnLSummary {
  unrealisedPnL: number | null       // null when no current price
  unrealisedPnLPct: number | null
  realisedPnL: number | null         // null until closed
  realisedPnLPct: number | null
  holdingDays: number
  isStopLossBreached: boolean
  isTargetHit: boolean
}

// ─── Alpha Vantage API response ───────────────────────────────────────────────
// /api/prices 路由回傳的格式：成功時有 price，失敗時有 error 訊息

export interface PriceResponse {
  ticker: string
  price: number | null
  error?: string
}
