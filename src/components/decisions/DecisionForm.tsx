'use client'

import React, { useState } from 'react'
import { Timestamp } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { Target, ShieldAlert, TrendingUp, Save, ArrowLeft, Info } from 'lucide-react'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createDecision, updateDecision } from '@/lib/firestore'
import { useAuth } from '@/contexts/AuthContext'
import { Decision, DecisionInput, DECISION_REQUIRED_FIELDS } from '@/lib/types'
import { fromDateInputValue, toDateInputValue } from '@/lib/utils'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface DecisionFormProps {
  initial?: Decision
}

type FormErrors = Partial<Record<string, string>>

const SECTORS = [
  'Technology', 'Healthcare', 'Financials', 'Consumer Discretionary',
  'Consumer Staples', 'Industrials', 'Energy', 'Materials',
  'Real Estate', 'Utilities', 'Communication Services', 'Crypto', 'Other',
]

function defaultValues(d?: Decision): Partial<DecisionInput> {
  if (!d) {
    return {
      ticker: '',
      companyName: '',
      entryPrice: undefined,
      entryDate: undefined,
      thesis: '',
      positionSize: undefined,
      positionUnit: 'dollars',
      stopLoss: undefined,
      targetPrice: undefined,
      sector: '',
      direction: 'long',
      tags: [],
      notes: '',
      status: 'active',
      exitPrice: null,
      exitDate: null,
      currentPrice: null,
    }
  }
  return {
    ticker: d.ticker,
    companyName: d.companyName,
    entryPrice: d.entryPrice,
    entryDate: d.entryDate,
    thesis: d.thesis,
    positionSize: d.positionSize,
    positionUnit: d.positionUnit,
    stopLoss: d.stopLoss,
    targetPrice: d.targetPrice,
    sector: d.sector,
    direction: d.direction,
    tags: d.tags,
    notes: d.notes,
    status: d.status,
    exitPrice: d.exitPrice,
    exitDate: d.exitDate,
    currentPrice: d.currentPrice,
  }
}

export function DecisionForm({ initial }: DecisionFormProps) {
  const { user } = useAuth()
  const router = useRouter()

  const [form, setForm] = useState({
    ticker: initial?.ticker ?? '',
    companyName: initial?.companyName ?? '',
    entryPriceStr: initial?.entryPrice?.toString() ?? '',
    entryDate: initial?.entryDate
      ? toDateInputValue(initial.entryDate.toDate())
      : toDateInputValue(new Date()),
    thesis: initial?.thesis ?? '',
    positionSizeStr: initial?.positionSize?.toString() ?? '',
    positionUnit: initial?.positionUnit ?? 'dollars',
    stopLossStr: initial?.stopLoss?.toString() ?? '',
    targetPriceStr: initial?.targetPrice?.toString() ?? '',
    sector: initial?.sector ?? '',
    direction: initial?.direction ?? 'long',
    tagsStr: initial?.tags?.join(', ') ?? '',
    notes: initial?.notes ?? '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  // Risk/reward preview
  const ep = parseFloat(form.entryPriceStr)
  const tp = parseFloat(form.targetPriceStr)
  const sl = parseFloat(form.stopLossStr)
  const rrRatio =
    !isNaN(ep) && !isNaN(tp) && !isNaN(sl) && sl !== ep
      ? Math.abs((tp - ep) / (ep - sl))
      : null

  function validate(): boolean {
    const errs: FormErrors = {}

    if (!form.ticker.trim()) errs.ticker = 'Ticker is required'
    if (!form.entryPriceStr || isNaN(parseFloat(form.entryPriceStr)) || parseFloat(form.entryPriceStr) <= 0)
      errs.entryPriceStr = 'Entry price is required and must be positive'
    if (!form.entryDate) errs.entryDate = 'Entry date is required'
    if (!form.thesis.trim()) errs.thesis = 'Investment thesis is required'
    if (!form.positionSizeStr || isNaN(parseFloat(form.positionSizeStr)) || parseFloat(form.positionSizeStr) <= 0)
      errs.positionSizeStr = 'Position size is required and must be positive'
    if (!form.stopLossStr || isNaN(parseFloat(form.stopLossStr)) || parseFloat(form.stopLossStr) <= 0)
      errs.stopLossStr = 'Stop-loss is required and must be positive'
    if (!form.targetPriceStr || isNaN(parseFloat(form.targetPriceStr)) || parseFloat(form.targetPriceStr) <= 0)
      errs.targetPriceStr = 'Target price is required and must be positive'

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate() || !user) return

    setSaving(true)
    try {
      const payload: DecisionInput = {
        ticker: form.ticker.trim().toUpperCase(),
        companyName: form.companyName.trim(),
        entryPrice: parseFloat(form.entryPriceStr),
        entryDate: Timestamp.fromDate(fromDateInputValue(form.entryDate)),
        thesis: form.thesis.trim(),
        positionSize: parseFloat(form.positionSizeStr),
        positionUnit: form.positionUnit as 'dollars' | 'shares',
        stopLoss: parseFloat(form.stopLossStr),
        targetPrice: parseFloat(form.targetPriceStr),
        sector: form.sector,
        direction: form.direction as 'long' | 'short',
        tags: form.tagsStr
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        notes: form.notes.trim(),
        status: initial?.status ?? 'active',
        exitPrice: initial?.exitPrice ?? null,
        exitDate: initial?.exitDate ?? null,
        currentPrice: initial?.currentPrice ?? null,
      }

      if (initial) {
        await updateDecision(user.uid, initial.id, payload)
        toast.success('Decision updated')
      } else {
        const created = await createDecision(user.uid, payload)
        toast.success('Decision created')
        router.push(`/decisions/${created.id}`)
        return
      }

      router.push(`/decisions/${initial.id}`)
    } catch (err) {
      toast.error('Failed to save decision')
    } finally {
      setSaving(false)
    }
  }

  const hasErrors = Object.values(errors).some(Boolean)

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {/* Required fields banner */}
      {hasErrors && (
        <div className="rounded-lg border border-loss/40 bg-loss-muted px-4 py-3 flex items-center gap-2 text-sm text-loss-text animate-fade-in">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          Please fill in all required fields before saving.
        </div>
      )}

      {/* Section: Core */}
      <section>
        <SectionHeader icon={<TrendingUp className="w-4 h-4" />} title="Position Details" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            label="Ticker"
            required
            placeholder="AAPL"
            value={form.ticker}
            onChange={(e) => set('ticker', e.target.value.toUpperCase())}
            error={errors.ticker}
            className="uppercase"
          />
          <Input
            label="Company / Asset Name"
            placeholder="Apple Inc."
            value={form.companyName}
            onChange={(e) => set('companyName', e.target.value)}
          />
          <Select
            label="Direction"
            value={form.direction}
            onChange={(e) => set('direction', e.target.value as import('@/lib/types').PositionDirection)}
          >
            <option value="long">Long</option>
            <option value="short">Short</option>
          </Select>
          <Input
            label="Entry Price"
            required
            type="number"
            step="0.01"
            min="0"
            placeholder="150.00"
            value={form.entryPriceStr}
            onChange={(e) => set('entryPriceStr', e.target.value)}
            error={errors.entryPriceStr}
          />
          <Input
            label="Entry Date"
            required
            type="date"
            value={form.entryDate}
            onChange={(e) => set('entryDate', e.target.value)}
            error={errors.entryDate}
          />
          <Select
            label="Sector"
            value={form.sector}
            onChange={(e) => set('sector', e.target.value)}
          >
            <option value="">— Select sector —</option>
            {SECTORS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </div>
      </section>

      {/* Section: Position Sizing */}
      <section>
        <SectionHeader icon={<ShieldAlert className="w-4 h-4" />} title="Risk Management" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                label="Position Size"
                required
                type="number"
                step="0.01"
                min="0"
                placeholder={form.positionUnit === 'dollars' ? '5000' : '100'}
                value={form.positionSizeStr}
                onChange={(e) => set('positionSizeStr', e.target.value)}
                error={errors.positionSizeStr}
              />
            </div>
            <div className="pt-[22px]">
              <Select
                value={form.positionUnit}
                onChange={(e) => set('positionUnit', e.target.value as import('@/lib/types').PositionUnit)}
              >
                <option value="dollars">USD $</option>
                <option value="shares">Shares</option>
              </Select>
            </div>
          </div>
          <Input
            label="Stop-Loss Price"
            required
            type="number"
            step="0.01"
            min="0"
            placeholder="140.00"
            value={form.stopLossStr}
            onChange={(e) => set('stopLossStr', e.target.value)}
            error={errors.stopLossStr}
          />
          <div className="flex flex-col gap-1.5">
            <Input
              label="Target Price"
              required
              type="number"
              step="0.01"
              min="0"
              placeholder="180.00"
              value={form.targetPriceStr}
              onChange={(e) => set('targetPriceStr', e.target.value)}
              error={errors.targetPriceStr}
            />
            {rrRatio !== null && (
              <p className={cn(
                'text-xs font-mono',
                rrRatio >= 2 ? 'text-gain-text' : rrRatio >= 1 ? 'text-warn-text' : 'text-loss-text',
              )}>
                R:R ratio — {rrRatio.toFixed(2)}:1{' '}
                {rrRatio >= 2 ? '✓ Good' : rrRatio < 1 ? '⚠ Poor' : ''}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Section: Thesis */}
      <section>
        <SectionHeader icon={<Target className="w-4 h-4" />} title="Thesis & Notes" />
        <div className="space-y-4">
          <Textarea
            label="Investment Thesis"
            required
            placeholder="Why are you entering this trade? What's your edge? What catalysts do you expect?"
            value={form.thesis}
            onChange={(e) => set('thesis', e.target.value)}
            error={errors.thesis}
            className="min-h-[120px]"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Tags"
              placeholder="momentum, earnings, breakout"
              value={form.tagsStr}
              onChange={(e) => set('tagsStr', e.target.value)}
              hint="Comma-separated"
            />
            <Textarea
              label="Additional Notes"
              placeholder="Any extra context…"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-surface-border">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          iconLeft={<ArrowLeft className="w-4 h-4" />}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={saving}
          iconLeft={<Save className="w-4 h-4" />}
        >
          {initial ? 'Save Changes' : 'Create Decision'}
        </Button>
      </div>
    </form>
  )
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-brand">{icon}</span>
      <h3 className="text-sm font-semibold text-white tracking-wide uppercase">{title}</h3>
      <div className="flex-1 h-px bg-surface-border ml-2" />
    </div>
  )
}
