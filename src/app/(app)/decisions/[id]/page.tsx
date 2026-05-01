'use client'

// 決策卡詳情頁面（Page A — 查看模式）
// [id] 是動態路由參數，對應到 Firestore 中的文件 ID
// 透過 useDecision Hook 即時監聽單筆文件的變動
// DecisionCardView 元件負責渲染所有詳情，以及「賣出」按鈕（觸發複盤彈窗）

import React from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useDecision } from '@/hooks/useDecisions'
import { DecisionCardView } from '@/components/decisions/DecisionCardView'

interface PageProps {
  params: { id: string }
}

export default function DecisionDetailPage({ params }: PageProps) {
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
        <p>Decision not found.</p>
        <Link href="/decisions" className="text-brand hover:text-brand-hover text-sm mt-2 inline-block">
          ← Back to decisions
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
        <span className="text-sm text-slate-300 font-mono">{decision.ticker}</span>
      </div>

      <DecisionCardView decision={decision} />
    </div>
  )
}
