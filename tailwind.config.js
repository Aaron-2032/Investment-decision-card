// Tailwind CSS 樣式設定檔
// 定義整個應用的設計系統：顏色、字型、動畫等
// 所有自訂顏色名稱（如 surface、brand、gain、loss）都在這裡統一管理

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    // 告訴 Tailwind 要掃描哪些檔案，只保留真正用到的 CSS class（減少打包體積）
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 深色背景色系：surface 是頁面底色，raised 是卡片，overlay 是浮層
        surface: {
          DEFAULT: '#0f1117',
          raised: '#161b27',
          overlay: '#1d2336',
          border: '#2a3144',
        },
        // 品牌主色：紫色系，用於按鈕、連結、焦點環等互動元素
        brand: {
          DEFAULT: '#6366f1',
          hover: '#818cf8',
          muted: '#312e81',
        },
        // 盈利顏色（綠色系）：用於正報酬、做多標籤
        gain: {
          DEFAULT: '#22c55e',
          muted: '#14532d',
          text: '#4ade80',
        },
        // 虧損顏色（紅色系）：用於負報酬、停損觸發、必填欄位標記
        loss: {
          DEFAULT: '#ef4444',
          muted: '#7f1d1d',
          text: '#f87171',
        },
        // 警告顏色（琥珀色系）：用於警示橫幅、星級評分
        warn: {
          DEFAULT: '#f59e0b',
          muted: '#78350f',
          text: '#fbbf24',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      // 自訂動畫：用於頁面元素的淡入與滑入效果
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

module.exports = config
