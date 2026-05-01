'use client'

// 強制複盤彈窗（Review Modal）—— 核心功能之一
// 每次按下「賣出」時自動觸發，分三個步驟引導使用者完成：
//   步驟 1（sell）     → 填寫出場價格與日期，即時預覽損益
//   步驟 2（postmortem）→ 反思交易過程：論點是否驗證、情緒狀態、心得
//   步驟 3（summary）  → 確認所有資訊後，正式關閉部位並寫入 Firestore
// forced=true 確保用戶無法跳過複盤流程直接關閉

import React, { useState } from 'react'
import { Timestamp } from 'firebase/firestore'
import { AlertTriangle, CheckCircle, Star, ChevronRight, ChevronLeft } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { createReview, updateDecision, calcPnL, calcPnLPct } from '@/lib/firestore'
import { formatCurrency, formatPct } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { Decision, ReviewInput, ReviewOutcome } from '@/lib/types'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface ReviewModalProps {
  decision: Decision
  onClose: () => void
  onComplete: () => void
}

type Step = 'sell' | 'postmortem' | 'summary'

interface SellFields {
  exitPrice: string
  exitDate: string
}

interface PostmortemFields {
  thesisValidated: boolean
  followedPlan: boolean
  emotionalState: string
  whatWentRight: string
  whatWentWrong: string
  lessonsLearned: string
  rating: number
}

const emotionalStateOptions = [
  'Calm & disciplined',
  'Greedy',
  'Fearful',
  'Impatient',
  'Confident',
  'Uncertain',
  'Overconfident',
  'Anxious',
]

export function ReviewModal({ decision, onClose, onComplete }: ReviewModalProps) {
  const { user } = useAuth()
  const [step, setStep] = useState<Step>('sell')
  const [saving, setSaving] = useState(false)

  const [sell, setSell] = useState<SellFields>({
    exitPrice: '',
    exitDate: new Date().toISOString().split('T')[0],
  })
  const [errors, setErrors] = useState<Partial<Record<keyof SellFields, string>>>({})

  const [post, setPost] = useState<PostmortemFields>({
    thesisValidated: false,
    followedPlan: true,
    emotionalState: 'Calm & disciplined',
    whatWentRight: '',
    whatWentWrong: '',
    lessonsLearned: '',
    rating: 3,
  })

  const exitPrice = parseFloat(sell.exitPrice)
  const pnl =
    !isNaN(exitPrice) && exitPrice > 0
      ? calcPnL(
          decision.direction,
          decision.entryPrice,
          exitPrice,
          decision.positionSize,
          decision.positionUnit,
        )
      : null
  const pnlPct =
    !isNaN(exitPrice) && exitPrice > 0
      ? calcPnLPct(decision.direction, decision.entryPrice, exitPrice)
      : null

  function deriveOutcome(): ReviewOutcome {
    if (pnl === null) return 'breakeven'
    if (pnl > 0) return 'win'
    if (pnl < 0) return 'loss'
    return 'breakeven'
  }

  function validateSell() {
    const errs: Partial<Record<keyof SellFields, string>> = {}
    if (!sell.exitPrice || isNaN(parseFloat(sell.exitPrice)) || parseFloat(sell.exitPrice) <= 0) {
      errs.exitPrice = 'Exit price is required and must be positive'
    }
    if (!sell.exitDate) {
      errs.exitDate = 'Exit date is required'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleComplete() {
    if (!user) return
    setSaving(true)
    try {
      const exitDate = Timestamp.fromDate(new Date(sell.exitDate + 'T00:00:00'))
      const ep = parseFloat(sell.exitPrice)

      const reviewInput: ReviewInput = {
        decisionId: decision.id,
        exitPrice: ep,
        exitDate,
        outcome: deriveOutcome(),
        thesisValidated: post.thesisValidated,
        followedPlan: post.followedPlan,
        emotionalState: post.emotionalState,
        whatWentRight: post.whatWentRight,
        whatWentWrong: post.whatWentWrong,
        lessonsLearned: post.lessonsLearned,
        rating: post.rating,
      }

      await createReview(user.uid, decision.id, reviewInput)
      await updateDecision(user.uid, decision.id, {
        status: 'closed',
        exitPrice: ep,
        exitDate,
        currentPrice: ep,
      })

      toast.success('Position closed & review saved')
      onComplete()
    } catch (err) {
      toast.error('Failed to save review')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      forced
      size="lg"
      title={step === 'sell' ? '🔔 Record Sell Event' : step === 'postmortem' ? '📋 Post-Mortem Review' : '✅ Review Complete'}
      description={
        step === 'sell'
          ? `Closing ${decision.ticker} — fill in your exit details to proceed.`
          : step === 'postmortem'
          ? 'Reflect on this trade before archiving it.'
          : undefined
      }
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6 -mt-1">
        {(['sell', 'postmortem', 'summary'] as Step[]).map((s, i) => (
          <React.Fragment key={s}>
            <div
              className={cn(
                'flex items-center gap-1.5 text-xs font-medium',
                step === s
                  ? 'text-brand'
                  : i < ['sell', 'postmortem', 'summary'].indexOf(step)
                  ? 'text-gain-text'
                  : 'text-slate-600',
              )}
            >
              <span
                className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center text-xs border',
                  step === s
                    ? 'border-brand bg-brand-muted text-brand'
                    : i < ['sell', 'postmortem', 'summary'].indexOf(step)
                    ? 'border-gain bg-gain-muted text-gain-text'
                    : 'border-surface-border text-slate-600',
                )}
              >
                {i < ['sell', 'postmortem', 'summary'].indexOf(step) ? '✓' : i + 1}
              </span>
              <span className="hidden sm:inline capitalize">{s}</span>
            </div>
            {i < 2 && <div className="flex-1 h-px bg-surface-border" />}
          </React.Fragment>
        ))}
      </div>

      {/* STEP 1 — Sell event */}
      {step === 'sell' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Exit Price"
              required
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 175.50"
              value={sell.exitPrice}
              onChange={(e) => setSell({ ...sell, exitPrice: e.target.value })}
              error={errors.exitPrice}
            />
            <Input
              label="Exit Date"
              required
              type="date"
              value={sell.exitDate}
              onChange={(e) => setSell({ ...sell, exitDate: e.target.value })}
              error={errors.exitDate}
            />
          </div>

          {/* Live PnL preview */}
          {pnl !== null && pnlPct !== null && (
            <div
              className={cn(
                'rounded-lg border p-4 flex items-center justify-between',
                pnl >= 0 ? 'border-gain/30 bg-gain-muted' : 'border-loss/30 bg-loss-muted',
              )}
            >
              <div className="space-y-0.5">
                <p className="text-xs text-slate-400">Realised P&L</p>
                <p
                  className={cn(
                    'text-xl font-bold font-mono',
                    pnl >= 0 ? 'text-gain-text' : 'text-loss-text',
                  )}
                >
                  {pnl >= 0 ? '+' : ''}
                  {formatCurrency(pnl)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Return</p>
                <p
                  className={cn(
                    'text-lg font-semibold font-mono',
                    pnl >= 0 ? 'text-gain-text' : 'text-loss-text',
                  )}
                >
                  {formatPct(pnlPct)}
                </p>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-warn/30 bg-warn-muted p-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warn-text shrink-0" />
            <p className="text-xs text-warn-text">
              A post-mortem review is required before this position can be closed.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={() => {
                if (validateSell()) setStep('postmortem')
              }}
              iconRight={<ChevronRight className="w-4 h-4" />}
            >
              Next: Post-Mortem
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2 — Post-mortem */}
      {step === 'postmortem' && (
        <div className="space-y-5">
          {/* Yes/No toggles */}
          <div className="grid grid-cols-2 gap-4">
            <ToggleField
              label="Thesis validated?"
              value={post.thesisValidated}
              onChange={(v) => setPost({ ...post, thesisValidated: v })}
            />
            <ToggleField
              label="Followed the plan?"
              value={post.followedPlan}
              onChange={(v) => setPost({ ...post, followedPlan: v })}
            />
          </div>

          <Select
            label="Emotional state during trade"
            value={post.emotionalState}
            onChange={(e) => setPost({ ...post, emotionalState: e.target.value })}
          >
            {emotionalStateOptions.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Textarea
              label="What went right?"
              placeholder="Be specific…"
              value={post.whatWentRight}
              rows={3}
              onChange={(e) => setPost({ ...post, whatWentRight: e.target.value })}
            />
            <Textarea
              label="What went wrong?"
              placeholder="Be honest…"
              value={post.whatWentWrong}
              rows={3}
              onChange={(e) => setPost({ ...post, whatWentWrong: e.target.value })}
            />
          </div>

          <Textarea
            label="Key lessons learned"
            placeholder="What would you do differently next time?"
            value={post.lessonsLearned}
            rows={3}
            onChange={(e) => setPost({ ...post, lessonsLearned: e.target.value })}
          />

          {/* Trade rating */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">
              Trade execution quality
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPost({ ...post, rating: n })}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      'w-6 h-6 transition-colors',
                      n <= post.rating
                        ? 'fill-warn-text text-warn-text'
                        : 'text-slate-700',
                    )}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-slate-400 self-center">
                {['', 'Poor', 'Below avg', 'Average', 'Good', 'Excellent'][post.rating]}
              </span>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={() => setStep('sell')} iconLeft={<ChevronLeft className="w-4 h-4" />}>
              Back
            </Button>
            <Button
              onClick={() => setStep('summary')}
              iconRight={<ChevronRight className="w-4 h-4" />}
            >
              Preview Summary
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3 — Summary */}
      {step === 'summary' && (
        <div className="space-y-5">
          <div className="rounded-lg border border-surface-border divide-y divide-surface-border overflow-hidden">
            <SummaryRow label="Ticker" value={decision.ticker} />
            <SummaryRow label="Entry" value={formatCurrency(decision.entryPrice)} />
            <SummaryRow label="Exit" value={formatCurrency(parseFloat(sell.exitPrice))} />
            {pnl !== null && (
              <SummaryRow
                label="P&L"
                value={
                  <span className={pnl >= 0 ? 'text-gain-text' : 'text-loss-text'}>
                    {pnl >= 0 ? '+' : ''}
                    {formatCurrency(pnl)} ({formatPct(pnlPct!)})
                  </span>
                }
              />
            )}
            <SummaryRow label="Outcome" value={
              <span className={cn(
                'capitalize font-semibold',
                deriveOutcome() === 'win' ? 'text-gain-text' : deriveOutcome() === 'loss' ? 'text-loss-text' : 'text-slate-300'
              )}>
                {deriveOutcome()}
              </span>
            } />
            <SummaryRow label="Thesis validated" value={post.thesisValidated ? '✅ Yes' : '❌ No'} />
            <SummaryRow label="Followed plan" value={post.followedPlan ? '✅ Yes' : '❌ No'} />
            <SummaryRow label="Emotional state" value={post.emotionalState} />
            <SummaryRow
              label="Rating"
              value={
                <span className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={cn(
                        'w-3.5 h-3.5',
                        n <= post.rating ? 'fill-warn-text text-warn-text' : 'text-slate-700',
                      )}
                    />
                  ))}
                </span>
              }
            />
          </div>

          {post.lessonsLearned && (
            <div className="rounded-lg border border-brand/30 bg-brand-muted p-3">
              <p className="text-xs text-slate-400 mb-1 font-medium">Lessons learned</p>
              <p className="text-sm text-slate-200">{post.lessonsLearned}</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" onClick={() => setStep('postmortem')} iconLeft={<ChevronLeft className="w-4 h-4" />}>
              Back
            </Button>
            <Button
              variant="gain"
              loading={saving}
              iconLeft={<CheckCircle className="w-4 h-4" />}
              onClick={handleComplete}
            >
              Close Position & Save Review
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

function ToggleField({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <div className="flex rounded-lg overflow-hidden border border-surface-border">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={cn(
            'flex-1 py-2 text-xs font-medium transition-colors',
            value ? 'bg-gain-muted text-gain-text' : 'text-slate-500 hover:text-slate-300',
          )}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={cn(
            'flex-1 py-2 text-xs font-medium transition-colors border-l border-surface-border',
            !value ? 'bg-loss-muted text-loss-text' : 'text-slate-500 hover:text-slate-300',
          )}
        >
          No
        </button>
      </div>
    </div>
  )
}

function SummaryRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm text-slate-200 font-medium">{value}</span>
    </div>
  )
}
