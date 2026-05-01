'use client'

// 頂部導覽列
// sticky 定位讓它在捲動時始終固定在頂部
// 使用 usePathname 偵測當前路由，自動高亮對應的導覽連結

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart2, List, TrendingUp, LogOut, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/decisions', label: 'Decisions', icon: List },
  { href: '/tracker', label: 'Tracker', icon: TrendingUp },
]

export function Navbar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-40 border-b border-surface-border bg-surface/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/decisions" className="flex items-center gap-2 group">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand text-white">
              <BarChart2 className="w-4 h-4" />
            </span>
            <span className="hidden sm:block text-sm font-semibold text-white tracking-tight">
              Decision OS
            </span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  pathname.startsWith(href)
                    ? 'bg-surface-overlay text-white'
                    : 'text-slate-400 hover:text-white hover:bg-surface-overlay',
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </nav>

          {/* User menu */}
          <div className="flex items-center gap-2">
            {user && (
              <span className="hidden md:flex items-center gap-1.5 text-xs text-slate-500">
                <User className="w-3.5 h-3.5" />
                {user.email?.split('@')[0]}
              </span>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-overlay text-sm transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
