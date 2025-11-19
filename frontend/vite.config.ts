import react from '@vitejs/plugin-react'
import {defineConfig, loadEnv} from 'vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')

  return {
  plugins: [react()], server: {
    port: 3000,
    proxy: {
      '/api': {
        target: env.VITE_API_BASE_URL || 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
      build: {
        outDir: 'dist',
        sourcemap: true,
      },
      // 部署配置 - 支持子路径部署
      base: env.VITE_BASE_PATH || '/',
      // 配置路由历史模式支持
      define: {
        'import.meta.env.VITE_BASE_PATH': JSON.stringify(
            env.VITE_BASE_PATH || '/')
      }
  }
})