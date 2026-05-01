'use client'

// 浮動快速筆記按鈕
// 固定在畫面右下角，隨時可點擊記下想法
// 儲存時可選擇連結到哪張進行中的決策卡，方便事後查閱

import React, { useState } from 'react'
import { MessageSquarePlus, X, Send, Link as LinkIcon } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useDecisions } from '@/hooks/useDecisions'
import { createNote } from '@/lib/firestore'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

export function QuickNoteButton() {
  const { user } = useAuth()
  const { decisions } = useDecisions(user?.uid)
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [linkedDecisionId, setLinkedDecisionId] = useState<string>('')
  const [saving, setSaving] = useState(false)

  if (!user) return null

  const activeDecisions = decisions.filter((d) => d.status === 'active')

  async function handleSave() {
    if (!content.trim() || !user) return
    setSaving(true)
    try {
      await createNote(user.uid, {
        content: content.trim(),
        decisionId: linkedDecisionId || null,
      })
      toast.success('Note saved')
      setContent('')
      setLinkedDecisionId('')
      setOpen(false)
    } catch (err) {
      toast.error('Failed to save note')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 z-30 flex items-center gap-2',
          'bg-brand hover:bg-brand-hover text-white',
          'shadow-lg shadow-brand/30 rounded-full px-4 h-11',
          'text-sm font-medium transition-all hover:scale-105 active:scale-95',
        )}
        title="Quick note"
      >
        <MessageSquarePlus className="w-4 h-4" />
        <span>Quick Note</span>
      </button>

      {/* Slide-up panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6 animate-fade-in">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-sm bg-surface-raised border border-surface-border rounded-2xl shadow-2xl animate-slide-up p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquarePlus className="w-4 h-4 text-brand" />
                <span className="font-semibold text-white text-sm">Quick Note</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-overlay transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Note textarea */}
            <textarea
              autoFocus
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave()
              }}
              placeholder="Capture your thought… (⌘+Enter to save)"
              rows={4}
              className="w-full rounded-lg border border-surface-border bg-surface-overlay px-3 py-2 text-sm text-white placeholder-slate-500 resize-none focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />

            {/* Link to decision */}
            {activeDecisions.length > 0 && (
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-slate-500 shrink-0" />
                <select
                  value={linkedDecisionId}
                  onChange={(e) => setLinkedDecisionId(e.target.value)}
                  className="flex-1 h-8 rounded-lg border border-surface-border bg-surface-overlay px-2 text-xs text-slate-300 focus:border-brand focus:outline-none"
                >
                  <option value="">— Link to a decision (optional) —</option>
                  {activeDecisions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.ticker} — {d.companyName || d.thesis.slice(0, 40)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-500">
                {content.length} chars
              </span>
              <button
                onClick={handleSave}
                disabled={!content.trim() || saving}
                className="flex items-center gap-1.5 bg-brand hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 h-8 rounded-lg transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
