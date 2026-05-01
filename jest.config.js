// Jest 測試設定檔
// 使用 next/jest 幫我們自動處理 Next.js 的環境（路徑別名、CSS 忽略等）
// 這樣我們不需要手動配置 Babel 或 Webpack
const nextJest = require('next/jest')

const createJestConfig = nextJest({ dir: './' })

/** @type {import('jest').Config} */
const config = {
  coverageProvider: 'v8',        // 使用 V8 引擎計算測試覆蓋率
  testEnvironment: 'jsdom',      // 模擬瀏覽器環境（DOM API），讓 React 元件可以被測試
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'], // 每次測試前執行的初始化檔案
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1', // 讓 @/ 路徑別名在測試中也能正常運作
  },
}

module.exports = createJestConfig(config)
