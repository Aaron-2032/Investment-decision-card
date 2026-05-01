'use client'

// 編輯決策卡頁面（Page A — 編輯模式）
// 傳入 initial={decision} 給 DecisionForm，使其進入「更新」模式
// 表單會預填現有資料，儲存時呼叫 updateDecision 而非 createDecision

import React from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useDecision } from '@/hooks/useDecisions'
import { DecisionForm } from '@/components/decisions/DecisionForm'

interface PageProps {
  params: { id: string }
}

export default function EditDecisionPage({ params }: PageProps) {
  const { user } = useAuth()
  const { decision, loading } = useDecision(user?.uid, params.id)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!decision) {
    return (
      <div className="text-center py-24 text-slate-500">
        Decision not found.
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          href={`/decisions/${params.id}`}
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {decision.ticker}
        </Link>
        <span className="text-slate-600">/</span>
        <span className="text-sm text-slate-300">Edit</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">Edit Decision</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Update your thesis or risk parameters.
        </p>
      </div>

      <div className="rounded-2xl border border-surface-border bg-surface-raised p-6 sm:p-8">
        <DecisionForm initial={decision} />
      </div>
    </div>
  )
}
