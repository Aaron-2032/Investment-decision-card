'use client'

// 快速筆記的即時資料 Hook
// decisionId 有值時只顯示該決策卡的筆記；無值時顯示所有筆記

import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { QuickNote } from '@/lib/types'

export function useNotes(userId: string | undefined, decisionId?: string | null) {
  const [notes, setNotes] = useState<QuickNote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setNotes([])
      setLoading(false)
      return
    }

    const col = collection(db, 'users', userId, 'notes')
    const q = decisionId
      ? query(col, where('decisionId', '==', decisionId), orderBy('createdAt', 'desc'))
      : query(col, orderBy('createdAt', 'desc'))

    const unsub = onSnapshot(q, (snap) => {
      setNotes(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as QuickNote))
      setLoading(false)
    })
    return unsub
  }, [userId, decisionId])

  return { notes, loading }
}
