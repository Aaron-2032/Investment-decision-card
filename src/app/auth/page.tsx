'use client'

// 登入 / 註冊頁面
// 支援兩種模式（mode）：
//   signin → 使用電子郵件 + 密碼登入現有帳戶
//   signup → 建立新帳戶
// 也支援 Google 一鍵登入（OAuth Popup 流程）
// 登入成功後自動跳轉到 /decisions

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart2, Mail, Lock, Eye, EyeOff, Chrome } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

type Mode = 'signin' | 'signup'

export default function AuthPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.replace('/decisions')
    }
  }, [user, loading, router])
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [errors, setErrors] = useState({ email: '', password: '' })

  function validate() {
    const errs = { email: '', password: '' }
    if (!email) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email'
    if (!password) errs.password = 'Password is required'
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters'
    setErrors(errs)
    return !errs.email && !errs.password
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password)
      } else {
        await signUpWithEmail(email, password)
      }
      router.replace('/decisions')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed'
      if (msg.includes('user-not-found') || msg.includes('wrong-password')) {
        toast.error('Invalid email or password')
      } else if (msg.includes('email-already-in-use')) {
        toast.error('Email already in use — try signing in')
      } else {
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
      // signInWithRedirect 會直接導向 Google，不會走到這裡
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      const msg = (err as { message?: string }).message ?? ''
      if (code === 'auth/unauthorized-domain') {
        toast.error('此網域尚未在 Firebase 授權')
      } else {
        toast.error(`Google 登入失敗：${code || msg}`)
      }
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand mb-4">
            <BarChart2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Investment Decision OS</h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Track your trades with discipline and clarity.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-surface-border bg-surface-raised p-8 shadow-2xl">
          {/* Tab switcher */}
          <div className="flex rounded-lg border border-surface-border overflow-hidden mb-6">
            {(['signin', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  mode === m
                    ? 'bg-brand text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`w-full h-10 pl-9 pr-3 rounded-lg border bg-surface-overlay text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 transition-colors ${
                    errors.email
                      ? 'border-loss focus:border-loss focus:ring-loss'
                      : 'border-surface-border focus:border-brand focus:ring-brand'
                  }`}
                />
              </div>
              {errors.email && <p className="text-xs text-loss-text">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full h-10 pl-9 pr-9 rounded-lg border bg-surface-overlay text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 transition-colors ${
                    errors.password
                      ? 'border-loss focus:border-loss focus:ring-loss'
                      : 'border-surface-border focus:border-brand focus:ring-brand'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-loss-text">{errors.password}</p>}
            </div>

            <Button type="submit" loading={loading} className="w-full h-10">
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-surface-border" />
            <span className="text-xs text-slate-600">or</span>
            <div className="flex-1 h-px bg-surface-border" />
          </div>

          {/* Google */}
          <Button
            variant="secondary"
            loading={googleLoading}
            onClick={handleGoogle}
            className="w-full h-10"
            iconLeft={<Chrome className="w-4 h-4" />}
          >
            Continue with Google
          </Button>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Your data is private and secured in Firestore.
        </p>
      </div>
    </div>
  )
}
