// 表單輸入元件集合：Input、Textarea、Select
// 統一外觀與錯誤樣式，required 欄位會顯示紅色星號 *
// 有 error 訊息時框線變紅，方便使用者識別哪個欄位填錯

import React from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  iconLeft?: React.ReactNode
}

export function Input({
  label,
  error,
  hint,
  required,
  iconLeft,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-300">
          {label}
          {required && <span className="ml-1 text-loss-text">*</span>}
        </label>
      )}
      <div className="relative">
        {iconLeft && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            {iconLeft}
          </span>
        )}
        <input
          id={inputId}
          className={cn(
            'w-full h-9 rounded-lg border bg-surface-overlay px-3 text-sm text-white placeholder-slate-500',
            'border-surface-border focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand',
            'transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
            error && 'border-loss focus:border-loss focus:ring-loss',
            iconLeft && 'pl-9',
            className,
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-loss-text">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  required?: boolean
}

export function Textarea({
  label,
  error,
  hint,
  required,
  className,
  id,
  ...props
}: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-300">
          {label}
          {required && <span className="ml-1 text-loss-text">*</span>}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          'w-full rounded-lg border bg-surface-overlay px-3 py-2 text-sm text-white placeholder-slate-500',
          'border-surface-border focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand',
          'transition-colors disabled:opacity-40 resize-y min-h-[80px]',
          error && 'border-loss focus:border-loss focus:ring-loss',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-loss-text">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  required?: boolean
  children: React.ReactNode
}

export function Select({
  label,
  error,
  required,
  className,
  id,
  children,
  ...props
}: SelectProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-300">
          {label}
          {required && <span className="ml-1 text-loss-text">*</span>}
        </label>
      )}
      <select
        id={inputId}
        className={cn(
          'w-full h-9 rounded-lg border bg-surface-overlay px-3 text-sm text-white',
          'border-surface-border focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand',
          'transition-colors disabled:opacity-40',
          error && 'border-loss focus:border-loss focus:ring-loss',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-loss-text">{error}</p>}
    </div>
  )
}
