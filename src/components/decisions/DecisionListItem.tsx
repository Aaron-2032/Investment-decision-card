'use client'

import React from 'react'
import Link from 'next/link'
import { ShieldAlert, Target, Clock, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { PnLCell } from '@/components/ui/PnLCell'
import { calcPnL, calcPnLPct, holdingDays } from '@/lib/firestore'
import { Decision } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface DecisionListItemProps {
  decision: Decision
}

export function DecisionListItem({ decision: d }: DecisionListItemProps) {
  const pnl = d.currentPrice
    ? calcPnL(d.direction, d.entryPrice, d.currentPrice, d.positionSize, d.positionUnit)
    : d.status === 'closed' && d.exitPrice
    ? calcPnL(d.direction, d.entryPrice, d.exitPrice, d.positionSize, d.positionUnit)
    : null

  const pnlPct = d.currentPrice
    ? calcPnLPct(d.direction, d.entryPrice, d.currentPrice)
    : d.status === 'closed' && d.exitPrice
    ? calcPnLPct(d.direction, d.entryPrice, d.exitPrice)
    : null

  const days = holdingDays(d.entryDate, d.exitDate)

  const isStopBreached =
    d.status === 'active' &&
    d.currentPrice != null &&
    (d.direction === 'long'
      ? d.currentPrice <= d.stopLoss
      : d.currentPrice >= d.stopLoss)

  const isTargetHit =
    d.status === 'active' &&
    d.currentPrice != null &&
    (d.direction === 'long'
      ? d.currentPrice >= d.targetPrice
      : d.currentPrice <= d.targetPrice)

  return (
    <Link
      href={`/decisions/${d.id}`}
      className={cn(
        'group flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all',
        'hover:border-brand/50 hover:bg-surface-overlay',
        isStopBreached
          ? 'border-loss/40 bg-loss-muted/30'
          : isTargetHit
          ? 'border-gain/40 bg-gain-muted/30'
          : 'border-surface-border bg-surface-raised',
      )}
    >
      {/* Ticker + badges */}
      <div className="w-28 shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono font-bold text-white text-sm">{d.ticker}</span>
          <Badge variant={d.direction === 'long' ? 'long' : 'short'} className="text-[10px]">
            {d.direction}
          </Badge>
        </div>
        {d.companyName && (
          <p className="text-xs text-slate-500 truncate mt-0.5">{d.companyName}</p>
        )}
      </div>

      {/* Entry / current */}
      <div className="hidden sm:flex flex-col gap-0.5 w-28 shrink-0">
        <span className="text-xs text-slate-500">Entry</span>
        <span className="text-sm font-mono text-slate-200">{formatCurrency(d.entryPrice)}</span>
      </div>

      <div className="hidden md:flex flex-col gap-0.5 w-28 shrink-0">
        <span className="text-xs text-slate-500">
          {d.status === 'closed' ? 'Exit' : 'Current'}
        </span>
        <span className="text-sm font-mono text-slate-200">
          {d.status === 'closed' && d.exitPrice
            ? formatCurrency(d.exitPrice)
            : d.currentPrice
            ? formatCurrency(d.currentPrice)
            : '—'}
        </span>
      </div>

      {/* P&L */}
      <div className="flex-1 min-w-0">
        <PnLCell value={pnl} pct={pnlPct} />
      </div>

      {/* Alerts */}
      <div className="hidden lg:flex items-center gap-2 shrink-0">
        {isStopBreached && (
          <span className="flex items-center gap-1 text-xs text-loss-text">
            <ShieldAlert className="w-3.5 h-3.5" /> Stop
          </span>
        )}
        {isTargetHit && (
          <span className="flex items-center gap-1 text-xs text-gain-text">
            <Target className="w-3.5 h-3.5" /> Target
          </span>
        )}
        <span className="flex items-center gap-1 text-xs text-slate-500">
          <Clock className="w-3.5 h-3.5" />
          {days}d
        </span>
      </div>

      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
    </Link>
  )
}
