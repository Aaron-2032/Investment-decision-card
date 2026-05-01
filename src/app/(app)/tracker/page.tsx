'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  TrendingUp, TrendingDown, RefreshCw, ShieldAlert, Target,
  Clock, BarChart3, AlertCircle
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useDecisions } from '@/hooks/useDecisions'
import { updateDecision, calcPnL, calcPnLPct, holdingDays } from '@/lib/firestore'
import { PnLCell } from '@/components/ui/PnLCell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Decision } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function TrackerPage() {
  const { user } = useAuth()
  const { decisions: active, loading: loadingActive } = useDecisions(user?.uid, 'active')
  const { decisions: closed } = useDecisions(user?.uid, 'closed')
  const [refreshingAll, setRefreshingAll] = useState(false)
  const [refreshingId, setRefreshingId] = useState<string | null>(null)

  async function refreshPrice(d: Decision) {
    if (!user) return
    setRefreshingId(d.id)
    try {
      const res = await fetch(`/api/prices?ticker=${d.ticker}`)
      const data = await res.json()
      if (data.price) {
        await updateDecision(user.uid, d.id, { currentPrice: data.price })
        toast.success(`${d.ticker} → $${data.price}`)
      } else {
        toast.error(`${d.ticker}: ${data.error ?? 'no price'}`)
      }
    } catch {
      toast.error('Fetch failed')
    } finally {
      setRefreshingId(null)
    }
  }

  async function refreshAll() {
    if (!user || active.length === 0) return
    setRefreshingAll(true)
    const results = await Promise.allSettled(
      active.map(async (d) => {
        const res = await fetch(`/api/prices?ticker=${d.ticker}`)
        const data = await res.json()
        if (data.price) {
          await updateDecision(user.uid, d.id, { currentPrice: data.price })
        }
      }),
    )
    const failed = results.filter((r) => r.status === 'rejected').length
    if (failed > 0) toast.error(`${failed} price(s) failed to update`)
    else toast.success('All prices refreshed')
    setRefreshingAll(false)
  }

  // ── Portfolio summary ──────────────────────────────────────────────────────
  const totalUnrealised = active.reduce((sum, d) => {
    const pnl = d.currentPrice
      ? calcPnL(d.direction, d.entryPrice, d.currentPrice, d.positionSize, d.positionUnit)
      : 0
    return sum + pnl
  }, 0)

  const totalRealised = closed.reduce((sum, d) => {
    if (!d.exitPrice) return sum
    return (
      sum +
      calcPnL(d.direction, d.entryPrice, d.exitPrice, d.positionSize, d.positionUnit)
    )
  }, 0)

  const stopBreaches = active.filter(
    (d) =>
      d.currentPrice != null &&
      (d.direction === 'long'
        ? d.currentPrice <= d.stopLoss
        : d.currentPrice >= d.stopLoss),
  )

  const targetHits = active.filter(
    (d) =>
      d.currentPrice != null &&
      (d.direction === 'long'
        ? d.currentPrice >= d.targetPrice
        : d.currentPrice <= d.targetPrice),
  )

  const winRate =
    closed.length > 0
      ? (closed.filter((d) => {
          if (!d.exitPrice) return false
          const pnl = calcPnLPct(d.direction, d.entryPrice, d.exitPrice)
          return pnl > 0
        }).length /
          closed.length) *
        100
      : null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Result Tracker</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Live P&L, risk alerts, and portfolio performance.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={refreshAll}
          loading={refreshingAll}
          iconLeft={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh All
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Unrealised P&L"
          value={<PnLCell value={totalUnrealised} showIcon />}
          icon={<TrendingUp className="w-4 h-4" />}
          color="brand"
        />
        <SummaryCard
          label="Realised P&L"
          value={<PnLCell value={totalRealised} showIcon />}
          icon={<BarChart3 className="w-4 h-4" />}
          color="brand"
        />
        <SummaryCard
          label="Win Rate"
          value={
            winRate !== null ? (
              <span className={winRate >= 50 ? 'text-gain-text' : 'text-loss-text'}>
                {winRate.toFixed(0)}%
              </span>
            ) : (
              <span className="text-slate-500">—</span>
            )
          }
          sub={`${closed.length} closed`}
          icon={<Target className="w-4 h-4" />}
          color="gain"
        />
        <SummaryCard
          label="Alerts"
          value={
            <span className={stopBreaches.length > 0 ? 'text-loss-text' : 'text-slate-400'}>
              {stopBreaches.length + targetHits.length}
            </span>
          }
          sub={`${stopBreaches.length} stop · ${targetHits.length} target`}
          icon={<AlertCircle className="w-4 h-4" />}
          color={stopBreaches.length > 0 ? 'loss' : 'gain'}
        />
      </div>

      {/* Stop-loss breach alerts */}
      {stopBreaches.length > 0 && (
        <div className="rounded-xl border border-loss/40 bg-loss-muted p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-loss-text">
            <ShieldAlert className="w-4 h-4" />
            Stop-Loss Breached ({stopBreaches.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {stopBreaches.map((d) => (
              <Link
                key={d.id}
                href={`/decisions/${d.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-loss/20 border border-loss/30 text-sm text-loss-text hover:bg-loss/30 transition-colors"
              >
                <span className="font-mono font-bold">{d.ticker}</span>
                <span className="text-xs opacity-75">
                  {d.currentPrice ? formatCurrency(d.currentPrice) : '—'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Active positions table */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
          Active Positions ({active.length})
        </h2>
        {loadingActive ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 rounded-full border-2 border-brand border-t-transparent animate-spin" />
          </div>
        ) : active.length === 0 ? (
          <p className="text-slate-500 text-sm py-6 text-center">No active positions.</p>
        ) : (
          <div className="rounded-xl border border-surface-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-overlay">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Ticker
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 hidden sm:table-cell">
                    Entry
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Current
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    P&L
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 hidden md:table-cell">
                    Stop / Target
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 hidden lg:table-cell">
                    Days
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Flags
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {active.map((d) => {
                  const pnl = d.currentPrice
                    ? calcPnL(
                        d.direction,
                        d.entryPrice,
                        d.currentPrice,
                        d.positionSize,
                        d.positionUnit,
                      )
                    : null
                  const pnlPct = d.currentPrice
                    ? calcPnLPct(d.direction, d.entryPrice, d.currentPrice)
                    : null
                  const days = holdingDays(d.entryDate, null)
                  const stopBreached =
                    d.currentPrice != null &&
                    (d.direction === 'long'
                      ? d.currentPrice <= d.stopLoss
                      : d.currentPrice >= d.stopLoss)
                  const targetHit =
                    d.currentPrice != null &&
                    (d.direction === 'long'
                      ? d.currentPrice >= d.targetPrice
                      : d.currentPrice <= d.targetPrice)

                  return (
                    <tr
                      key={d.id}
                      className={cn(
                        'hover:bg-surface-overlay transition-colors',
                        stopBreached && 'bg-loss-muted/20',
                        targetHit && !stopBreached && 'bg-gain-muted/20',
                      )}
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/decisions/${d.id}`}
                          className="flex items-center gap-1.5 hover:text-brand transition-colors"
                        >
                          <span className="font-mono font-bold text-white">{d.ticker}</span>
                          <Badge
                            variant={d.direction === 'long' ? 'long' : 'short'}
                            className="text-[10px]"
                          >
                            {d.direction}
                          </Badge>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-300 hidden sm:table-cell">
                        {formatCurrency(d.entryPrice)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-200">
                        {d.currentPrice ? formatCurrency(d.currentPrice) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <PnLCell value={pnl} pct={pnlPct} />
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-slate-500 hidden md:table-cell">
                        <span className="text-loss-text">{formatCurrency(d.stopLoss)}</span>
                        {' / '}
                        <span className="text-gain-text">{formatCurrency(d.targetPrice)}</span>
                      </td>
                      <td className="px-4 py-3 text-right hidden lg:table-cell">
                        <span className="flex items-center justify-end gap-1 text-slate-500 text-xs">
                          <Clock className="w-3.5 h-3.5" />
                          {days}d
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {stopBreached && (
                            <ShieldAlert className="w-4 h-4 text-loss-text" aria-label="Stop breached" />
                          )}
                          {targetHit && (
                            <Target className="w-4 h-4 text-gain-text" aria-label="Target hit" />
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => refreshPrice(d)}
                          disabled={refreshingId === d.id}
                          className="p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-surface-overlay disabled:opacity-40 transition-colors"
                          title="Refresh price"
                        >
                          <RefreshCw
                            className={cn(
                              'w-3.5 h-3.5',
                              refreshingId === d.id && 'animate-spin',
                            )}
                          />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Closed positions summary */}
      {closed.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
            Closed Positions ({closed.length})
          </h2>
          <div className="rounded-xl border border-surface-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-overlay">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Ticker
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 hidden sm:table-cell">
                    Entry
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Exit
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Realised P&L
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 hidden md:table-cell">
                    Held
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 hidden md:table-cell">
                    Closed
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {closed.map((d) => {
                  if (!d.exitPrice) return null
                  const pnl = calcPnL(
                    d.direction,
                    d.entryPrice,
                    d.exitPrice,
                    d.positionSize,
                    d.positionUnit,
                  )
                  const pnlPct = calcPnLPct(d.direction, d.entryPrice, d.exitPrice)
                  const days = holdingDays(d.entryDate, d.exitDate)
                  return (
                    <tr key={d.id} className="hover:bg-surface-overlay transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/decisions/${d.id}`}
                          className="flex items-center gap-1.5 hover:text-brand transition-colors"
                        >
                          <span className="font-mono font-bold text-slate-300">{d.ticker}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-400 hidden sm:table-cell">
                        {formatCurrency(d.entryPrice)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-300">
                        {formatCurrency(d.exitPrice)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <PnLCell value={pnl} pct={pnlPct} />
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-slate-500 hidden md:table-cell">
                        {days}d
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-slate-500 hidden md:table-cell">
                        {d.exitDate ? formatDate(d.exitDate.toDate()) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

function SummaryCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string
  value: React.ReactNode
  sub?: string
  icon: React.ReactNode
  color: 'brand' | 'gain' | 'loss'
}) {
  const iconColor = {
    brand: 'text-brand bg-brand-muted',
    gain: 'text-gain-text bg-gain-muted',
    loss: 'text-loss-text bg-loss-muted',
  }[color]

  return (
    <div className="rounded-xl border border-surface-border bg-surface-raised p-4 space-y-3">
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', iconColor)}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{label}</p>
        <div className="text-xl font-bold text-white mt-0.5 font-mono">{value}</div>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}
