'use client'

// 決策清單頁面（Page B）
// 三個分頁標籤（Active/Closed/Archived）切換時會重新訂閱 Firestore 對應集合
// 搜尋框即時過濾清單（在瀏覽器端完成，不需額外查詢資料庫）

import React, { useState } from 'react'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useDecisions } from '@/hooks/useDecisions'
import { DecisionListItem } from '@/components/decisions/DecisionListItem'
import { Button } from '@/components/ui/Button'
import { DecisionStatus } from '@/lib/types'

const TABS: { label: string; value: DecisionStatus }[] = [
  { label: 'Active', value: 'active' },
  { label: 'Closed', value: 'closed' },
  { label: 'Archived', value: 'archived' },
]

export default function DecisionsPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<DecisionStatus>('active')
  const [search, setSearch] = useState('')

  const { decisions, loading } = useDecisions(user?.uid, tab)

  const filtered = decisions.filter(
    (d) =>
      !search ||
      d.ticker.toLowerCase().includes(search.toLowerCase()) ||
      d.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      d.thesis.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Decisions</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Manage your investment decisions with discipline.
          </p>
        </div>
        <Link href="/decisions/new">
          <Button iconLeft={<Plus className="w-4 h-4" />}>New Decision</Button>
        </Link>
      </div>

      {/* Tabs + search */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="flex rounded-lg border border-surface-border overflow-hidden">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.value
                  ? 'bg-surface-overlay text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search ticker, name, thesis…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-surface-border bg-surface-overlay text-sm text-white placeholder-slate-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState tab={tab} search={search} />
      ) : (
        <div className="space-y-2">
          {filtered.map((d) => (
            <DecisionListItem key={d.id} decision={d} />
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState({ tab, search }: { tab: DecisionStatus; search: string }) {
  if (search) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p>No results for &ldquo;{search}&rdquo;</p>
      </div>
    )
  }

  const messages: Record<DecisionStatus, string> = {
    active: 'No active decisions yet.',
    closed: 'No closed positions yet.',
    archived: 'Nothing archived yet.',
  }

  return (
    <div className="text-center py-16 space-y-4">
      <p className="text-slate-500">{messages[tab]}</p>
      {tab === 'active' && (
        <Link href="/decisions/new">
          <Button size="sm" iconLeft={<Plus className="w-4 h-4" />}>
            Add your first decision
          </Button>
        </Link>
      )}
    </div>
  )
}
