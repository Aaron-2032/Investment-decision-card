'use client'

// 決策卡的即時資料 Hooks
// 使用 Firestore 的 onSnapshot 監聽器，資料庫有變動時畫面自動更新
// useDecisions → 取得清單；useDecision → 取得單筆詳情

import { useState, useEffect } from 'react'
import {
  collection,
  doc,
  query,
  orderBy,
  onSnapshot,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Decision, DecisionStatus } from '@/lib/types'

export function useDecisions(userId: string | undefined, status?: DecisionStatus) {
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setDecisions([])
      setLoading(false)
      return
    }

    const col = collection(db, 'users', userId, 'decisions')
    const q = status
      ? query(col, where('status', '==', status), orderBy('createdAt', 'desc'))
      : query(col, orderBy('createdAt', 'desc'))

    const unsub = onSnapshot(
      q,
      (snap) => {
        setDecisions(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Decision))
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
    )
    return unsub
  }, [userId, status])

  return { decisions, loading, error }
}

export function useDecision(userId: string | undefined, id: string | undefined) {
  const [decision, setDecision] = useState<Decision | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId || !id) {
      setLoading(false)
      return
    }
    const ref = doc(db, 'users', userId, 'decisions', id)
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setDecision({ id: snap.id, ...snap.data() } as Decision)
      }
      setLoading(false)
    })
    return unsub
  }, [userId, id])

  return { decision, loading }
}
