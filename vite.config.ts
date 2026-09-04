import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      // 前端请求 /api/* 转发到后端 FastAPI 服务
      // 新后端路由不再带 /api 前缀，这里剥离 /api，使 /api/auth/login -> /auth/login
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
