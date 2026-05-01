'use client'

// 已驗證區域的共用佈局（App Layout）
// (app) 是 Next.js 的 Route Group，不影響 URL，只用於共用這個 Layout
// 職責：
//   1. 未登入時自動導向 /auth（路由守衛）
//   2. 頂部顯示 Navbar
//   3. 右下角顯示 QuickNoteButton（浮動快速筆記）

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Navbar } from '@/components/layout/Navbar'
import { QuickNoteButton } from '@/components/layout/QuickNoteButton'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
          {children}
        </div>
      </main>
      <QuickNoteButton />
    </div>
  )
}
