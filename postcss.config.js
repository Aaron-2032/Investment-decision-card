// PostCSS 設定：處理 CSS 的工具鏈
// tailwindcss  → 將 @tailwind 指令展開成實際的 CSS
// autoprefixer → 自動加上 -webkit- 等瀏覽器前綴，確保跨瀏覽器相容
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
