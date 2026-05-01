// 股票即時報價的 Serverless API 路由
// 呼叫方式：GET /api/prices?ticker=AAPL
// 資料來源：Alpha Vantage GLOBAL_QUOTE（免費方案，每天最多 25 次請求）
// 為了節省免費配額，在記憶體中暫存 15 分鐘，相同股票在時間內不重複查詢
// 注意：Serverless 冷啟動後快取會清空，這對 MVP 階段來說是可接受的取捨

import { NextRequest, NextResponse } from 'next/server'
import type { PriceResponse } from '@/lib/types'

const AV_BASE = 'https://www.alphavantage.co/query'
const AV_KEY = process.env.ALPHA_VANTAGE_API_KEY ?? 'demo'

// In-memory cache: ticker → { price, fetchedAt }
// Resets on cold start — good enough for MVP serverless
const cache = new Map<string, { price: number; fetchedAt: number }>()
const CACHE_TTL_MS = 15 * 60 * 1000  // 15 minutes

export async function GET(req: NextRequest): Promise<NextResponse<PriceResponse>> {
  const ticker = req.nextUrl.searchParams.get('ticker')?.toUpperCase()

  if (!ticker) {
    return NextResponse.json({ ticker: '', price: null, error: 'ticker param required' }, { status: 400 })
  }

  // Serve from cache if fresh
  const cached = cache.get(ticker)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json({ ticker, price: cached.price })
  }

  try {
    // Alpha Vantage GLOBAL_QUOTE — free tier, up to 25 req/day
    const url = `${AV_BASE}?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${AV_KEY}`
    const res = await fetch(url, { next: { revalidate: 900 } })

    if (!res.ok) {
      throw new Error(`Alpha Vantage HTTP ${res.status}`)
    }

    const json = await res.json()
    const quote = json['Global Quote']

    if (!quote || !quote['05. price']) {
      // AV returns an empty object on unknown tickers or rate-limit
      const infoMsg =
        json['Information'] ?? json['Note'] ?? 'Ticker not found or API rate limit reached'
      return NextResponse.json({ ticker, price: null, error: String(infoMsg) })
    }

    const price = parseFloat(quote['05. price'])
    cache.set(ticker, { price, fetchedAt: Date.now() })

    return NextResponse.json({ ticker, price })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ticker, price: null, error: msg }, { status: 500 })
  }
}
