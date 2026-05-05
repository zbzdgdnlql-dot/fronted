<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { useAuth } from '../stores/auth'
import { logout as apiLogout } from '../api/endpoints'
import { useToast } from '../composables/useToast'
import router from '../router'

const route = useRoute()
const auth = useAuth()
const toast = useToast()

const studentLinks = [
  { name: '主页', path: '/' },
  { name: '任务', path: '/tasks' },
  { name: '历史记录', path: '/history' },
  { name: '档案资料', path: '/archive' },
  { name: '个人中心', path: '/profile' },
  { name: '关于', path: '/about' },
] as const

const teacherLinks = [
  { name: '概览', path: '/teacher/overview' },
  { name: '内容管理', path: '/teacher/content' },
  { name: '关于', path: '/about' },
] as const

const navLinks = computed(() => (auth.userType.value === 'teacher' ? teacherLinks : studentLinks))

const isActive = (path: string) => {
  if (path.startsWith('/teacher')) return route.path.startsWith('/teacher')
  return route.path === path
}

const onLogout = async () => {
  try {
    await apiLogout()
  } catch {}
  auth.clearSession()
  toast.push('已退出登录', 'success')
  router.push('/login')
}
</script>

<template>
  <header class="w-full bg-white border-b border-[#F2F4F7] h-[72px] px-6 flex items-center justify-between shadow-sm">
    <!-- Logo Area -->
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white overflow-hidden shadow-sm shadow-green-100">
        <img src="../assets/figma/link.svg" alt="Logo" class="w-full h-full object-cover" />
      </div>
      <h1 class="text-xl font-bold text-gray-900 tracking-tight">AI法语</h1>
    </div>

    <!-- Navigation -->
    <nav class="hidden md:flex items-center gap-8">
      <router-link 
        v-for="link in navLinks" 
        :key="link.name" 
        :to="link.path" 
        :class="[
          'text-[15px] font-bold transition-colors',
          isActive(link.path) ? 'text-[#70C125]' : 'text-gray-400 hover:text-gray-600'
        ]"
      >
        {{ link.name }}
      </router-link>
    </nav>

    <!-- Right Area: Class Label & User Avatar -->
    <div class="flex items-center gap-4">
      <div v-if="auth.className.value" class="hidden lg:flex items-center border-2 border-[#70C125] px-4 py-1.5 rounded-xl">
        <span class="text-sm font-black text-[#70C125] tracking-wide">{{ auth.className.value }}</span>
      </div>

      <button
        type="button"
        class="hidden md:inline-flex items-center gap-2 text-sm font-black text-gray-500 hover:text-gray-700"
        @click="onLogout"
      >
        退出
      </button>

      <div class="w-10 h-10 rounded-full border-2 border-[#70C125] p-0.5 overflow-hidden flex items-center justify-center bg-blue-50">
        <img src="../assets/figma/avatar.png" alt="Avatar" class="w-full h-full object-cover rounded-full" />
      </div>
    </div>
  </header>
</template>
