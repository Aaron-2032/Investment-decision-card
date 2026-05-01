// 損益顯示元件（P&L Cell）
// 根據數值正負自動顯示綠色（盈利）或紅色（虧損），並附上對應方向圖示
// value=null 時顯示 "—" 表示尚未取得報價

import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatCurrency, formatPct } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface PnLCellProps {
  value: number | null
  pct?: number | null
  showIcon?: boolean
  className?: string
}

export function PnLCell({ value, pct, showIcon = true, className }: PnLCellProps) {
  if (value === null || value === undefined) {
    return <span className="text-slate-500 font-mono text-sm">—</span>
  }

  const isGain = value > 0
  const isLoss = value < 0

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-mono text-sm font-medium',
        isGain && 'text-gain-text',
        isLoss && 'text-loss-text',
        !isGain && !isLoss && 'text-slate-400',
        className,
      )}
    >
      {showIcon && (
        isGain ? (
          <TrendingUp className="w-3.5 h-3.5" />
        ) : isLoss ? (
          <TrendingDown className="w-3.5 h-3.5" />
        ) : (
          <Minus className="w-3.5 h-3.5" />
        )
      )}
      {isGain && '+'}
      {formatCurrency(value)}
      {pct !== null && pct !== undefined && (
        <span className="text-xs opacity-75">({formatPct(pct)})</span>
      )}
    </span>
  )
}
