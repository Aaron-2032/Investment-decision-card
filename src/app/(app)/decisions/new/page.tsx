// 新增決策卡頁面（Page A — 建立模式）
// 純版面頁，實際表單邏輯在 DecisionForm 元件中
// 沒有傳入 initial prop，所以 DecisionForm 進入「建立」模式

import React from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { DecisionForm } from '@/components/decisions/DecisionForm'

export default function NewDecisionPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          href="/decisions"
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Decisions
        </Link>
        <span className="text-slate-600">/</span>
        <span className="text-sm text-slate-300">New</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">New Decision</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Document your thesis and risk parameters before entering the trade.
        </p>
      </div>

      <div className="rounded-2xl border border-surface-border bg-surface-raised p-6 sm:p-8">
        <DecisionForm />
      </div>
    </div>
  )
}
