'use client'

// 根路徑（/）的進入點頁面
// 只做一件事：根據登入狀態決定跳轉到哪裡
// 已登入 → /decisions；未登入 → /auth
// 等待 Firebase 確認狀態期間顯示旋轉載入圖示

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function RootPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      router.replace(user ? '/decisions' : '/auth')
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
    </div>
  )
}
