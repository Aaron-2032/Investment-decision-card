'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Edit, Trash2, DollarSign, Calendar, Target, ShieldAlert,
  Tag, FileText, RefreshCw, TrendingUp, TrendingDown, Archive,
  StickyNote, ChevronDown, ChevronUp
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PnLCell } from '@/components/ui/PnLCell'
import { ReviewModal } from '@/components/review/ReviewModal'
import { updateDecision, deleteDecision, calcPnL, calcPnLPct, holdingDays } from '@/lib/firestore'
import { useAuth } from '@/contexts/AuthContext'
import { useNotes } from '@/hooks/useNotes'
import { Decision } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface DecisionCardViewProps {
  decision: Decision
}

export function DecisionCardView({ decision }: DecisionCardViewProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { notes } = useNotes(user?.uid, decision.id)
  const [showReview, setShowReview] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const pnl = decision.currentPrice
    ? calcPnL(
        decision.direction,
        decision.entryPrice,
        decision.currentPrice,
        decision.positionSize,
        decision.positionUnit,
      )
    : null

  const pnlPct = decision.currentPrice
    ? calcPnLPct(decision.direction, decision.entryPrice, decision.currentPrice)
    : null

  const days = holdingDays(decision.entryDate, decision.exitDate)
  const isStopBreached =
    decision.currentPrice != null &&
    (decision.direction === 'long'
      ? decision.currentPrice <= decision.stopLoss
      : decision.currentPrice >= decision.stopLoss)

  const isTargetHit =
    decision.currentPrice != null &&
    (decision.direction === 'long'
      ? decision.currentPrice >= decision.targetPrice
      : decision.currentPrice <= decision.targetPrice)

  async function handleRefreshPrice() {
    if (!user) return
    setRefreshing(true)
    try {
      const res = await fetch(`/api/prices?ticker=${decision.ticker}`)
      const data = await res.json()
      if (data.price) {
        await updateDecision(user.uid, decision.id, { currentPrice: data.price })
        toast.success(`${decision.ticker}: $${data.price}`)
      } else {
        toast.error(data.error ?? 'Price not available')
      }
    } catch {
      toast.error('Failed to fetch price')
    } finally {
      setRefreshing(false)
    }
  }

  async function handleArchive() {
    if (!user || !confirm('Archive this decision?')) return
    await updateDecision(user.uid, decision.id, { status: 'archived' })
    toast.success('Archived')
    router.push('/decisions')
  }

  async function handleDelete() {
    if (!user || !confirm('Delete this decision permanently?')) return
    await deleteDecision(user.uid, decision.id)
    toast.success('Deleted')
    router.push('/decisions')
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 pb-6 border-b border-surface-border">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold text-white font-mono">{decision.ticker}</h1>
            <Badge variant={decision.status}>{decision.status}</Badge>
            <Badge variant={decision.direction === 'long' ? 'long' : 'short'}>
              {decision.direction.toUpperCase()}
            </Badge>
            {isStopBreached && (
              <Badge variant="loss">
                <ShieldAlert className="w-3 h-3" /> Stop Breached
              </Badge>
            )}
            {isTargetHit && (
              <Badge variant="gain">
                <Target className="w-3 h-3" /> Target Hit
              </Badge>
            )}
          </div>
          {decision.companyName && (
            <p className="text-slate-400 text-sm">{decision.companyName}</p>
          )}
          {decision.sector && (
            <p className="text-xs text-slate-500 mt-0.5">{decision.sector}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {decision.status === 'active' && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRefreshPrice}
                loading={refreshing}
                iconLeft={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Refresh Price
              </Button>
              <Button
                variant="loss"
                size="sm"
                onClick={() => setShowReview(true)}
                iconLeft={<TrendingDown className="w-3.5 h-3.5" />}
              >
                Record Sell
              </Button>
            </>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push(`/decisions/${decision.id}/edit`)}
            iconLeft={<Edit className="w-3.5 h-3.5" />}
          >
            Edit
          </Button>
          {decision.status !== 'archived' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleArchive}
              iconLeft={<Archive className="w-3.5 h-3.5" />}
            >
              Archive
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            iconLeft={<Trash2 className="w-3.5 h-3.5" />}
            className="text-loss-text hover:text-loss-text hover:bg-loss-muted"
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Current Price"
          value={decision.currentPrice ? formatCurrency(decision.currentPrice) : '—'}
          sub={decision.lastPriceFetch
            ? `Updated ${formatDate(decision.lastPriceFetch.toDate())}`
            : 'Not yet fetched'}
        />
        <StatCard
          label="Entry Price"
          value={formatCurrency(decision.entryPrice)}
          sub={formatDate(decision.entryDate.toDate())}
        />
        <StatCard
          label="Unrealised P&L"
          value={<PnLCell value={pnl} pct={pnlPct} />}
          sub={`${days} days held`}
        />
        <StatCard
          label="R:R"
          value={(() => {
            const rr = Math.abs(
              (decision.targetPrice - decision.entryPrice) /
                (decision.entryPrice - decision.stopLoss),
            )
            return isNaN(rr) || !isFinite(rr) ? '—' : `${rr.toFixed(2)}:1`
          })()}
          sub={`SL: ${formatCurrency(decision.stopLoss)} · TP: ${formatCurrency(decision.targetPrice)}`}
        />
      </div>

      {/* Thesis */}
      <div className="rounded-xl border border-surface-border bg-surface-raised p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
          Investment Thesis
        </h3>
        <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
          {decision.thesis}
        </p>
        {decision.tags && decision.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {decision.tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-surface-border text-slate-400"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Risk levels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <RiskBar
          label="Distance to Stop-Loss"
          current={decision.currentPrice ?? decision.entryPrice}
          entry={decision.entryPrice}
          target={decision.stopLoss}
          type="loss"
          direction={decision.direction}
        />
        <RiskBar
          label="Distance to Target"
          current={decision.currentPrice ?? decision.entryPrice}
          entry={decision.entryPrice}
          target={decision.targetPrice}
          type="gain"
          direction={decision.direction}
        />
      </div>

      {/* Notes section */}
      {notes.length > 0 && (
        <div className="rounded-xl border border-surface-border bg-surface-raised overflow-hidden">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="w-full flex items-center justify-between px-5 py-3 hover:bg-surface-overlay transition-colors"
          >
            <div className="flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-300">
                Quick Notes ({notes.length})
              </span>
            </div>
            {showNotes ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </button>
          {showNotes && (
            <div className="divide-y divide-surface-border">
              {notes.map((note) => (
                <div key={note.id} className="px-5 py-3">
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{note.content}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {formatDate(note.createdAt?.toDate())}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Forced review modal */}
      {showReview && (
        <ReviewModal
          decision={decision}
          onClose={() => setShowReview(false)}
          onComplete={() => {
            setShowReview(false)
            router.push('/decisions')
          }}
        />
      )}
    </>
  )
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string
  value: React.ReactNode
  sub?: string
}) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface-raised p-4 space-y-1">
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
      <div className="text-lg font-semibold text-white font-mono">{value}</div>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  )
}

function RiskBar({
  label,
  current,
  entry,
  target,
  type,
  direction,
}: {
  label: string
  current: number
  entry: number
  target: number
  type: 'gain' | 'loss'
  direction: 'long' | 'short'
}) {
  const dist =
    direction === 'long'
      ? type === 'gain'
        ? ((target - current) / current) * 100
        : ((current - target) / current) * 100
      : type === 'gain'
      ? ((current - target) / current) * 100
      : ((target - current) / current) * 100

  const pct = Math.max(0, Math.min(100, Math.abs(dist)))
  const breached = dist < 0

  return (
    <div className="rounded-xl border border-surface-border bg-surface-raised p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</span>
        <span
          className={cn(
            'text-sm font-mono font-semibold',
            breached
              ? type === 'loss'
                ? 'text-loss-text'
                : 'text-gain-text'
              : 'text-slate-300',
          )}
        >
          {formatCurrency(Math.abs(target - current))} ({Math.abs(dist).toFixed(1)}%)
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-overlay overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            type === 'gain' ? 'bg-gain' : 'bg-loss',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {breached && (
        <p className={cn('text-xs', type === 'loss' ? 'text-loss-text' : 'text-gain-text')}>
          {type === 'loss' ? '⚠ Stop-loss breached!' : '🎯 Target reached!'}
        </p>
      )}
    </div>
  )
}
