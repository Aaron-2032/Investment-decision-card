// 根佈局（Root Layout）
// 這是整個應用最外層的 HTML 結構，所有頁面都會套用這個佈局
// AuthProvider 包住全站，讓任何子頁面都能使用 useAuth()
// Toaster 是全域提示訊息（如「儲存成功」「錯誤」），顯示在右下角

import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Investment Decision OS',
  description: 'Record, track and review your investment decisions with discipline.',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1d2336',
                color: '#e2e8f0',
                border: '1px solid #2a3144',
                borderRadius: '10px',
                fontSize: '13px',
              },
              success: { iconTheme: { primary: '#22c55e', secondary: '#0f1117' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#0f1117' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
