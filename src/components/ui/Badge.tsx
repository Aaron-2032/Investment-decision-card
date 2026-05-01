// 標籤徽章元件（Badge）
// 用於顯示決策狀態、方向、損益狀態等小型標記
// 每種 variant 對應不同的色系，讓使用者一眼辨識

import React from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant =
  | 'active'
  | 'closed'
  | 'archived'
  | 'gain'
  | 'loss'
  | 'warn'
  | 'neutral'
  | 'long'
  | 'short'

const styles: Record<BadgeVariant, string> = {
  active: 'bg-brand-muted text-brand-hover border-brand/30',
  closed: 'bg-slate-800 text-slate-300 border-slate-700',
  archived: 'bg-slate-900 text-slate-500 border-slate-800',
  gain: 'bg-gain-muted text-gain-text border-gain/30',
  loss: 'bg-loss-muted text-loss-text border-loss/30',
  warn: 'bg-warn-muted text-warn-text border-warn/30',
  neutral: 'bg-surface-overlay text-slate-300 border-surface-border',
  long: 'bg-gain-muted text-gain-text border-gain/30',
  short: 'bg-loss-muted text-loss-text border-loss/30',
}

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
