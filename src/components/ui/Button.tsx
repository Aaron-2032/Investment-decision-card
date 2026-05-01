// 通用按鈕元件
// 透過 variant（外觀樣式）和 size（大小）組合出各種按鈕，整個應用統一使用這個元件
// loading 狀態時自動顯示旋轉圖示並禁用點擊，防止重複送出

import React from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

// 外觀樣式：主要/次要/幽靈/危險/盈利/虧損
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gain' | 'loss'
// 尺寸：小/中/大
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-brand text-white hover:bg-brand-hover focus-visible:ring-brand',
  secondary:
    'bg-surface-overlay border border-surface-border text-slate-200 hover:border-brand hover:text-white',
  ghost:
    'text-slate-400 hover:text-white hover:bg-surface-overlay',
  danger:
    'bg-loss text-white hover:bg-red-600 focus-visible:ring-loss',
  gain:
    'bg-gain text-white hover:bg-green-400 focus-visible:ring-gain',
  loss:
    'bg-loss text-white hover:bg-red-600 focus-visible:ring-loss',
}

const sizeStyles: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-6 text-base gap-2',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  iconLeft,
  iconRight,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        iconLeft
      )}
      {children}
      {!loading && iconRight}
    </button>
  )
}
