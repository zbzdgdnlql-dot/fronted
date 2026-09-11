<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const sideLinks = [
  { name: '概览', path: '/teacher/overview', icon: 'overview' },
  { name: '内容管理', path: '/teacher/content', icon: 'content' },
  { name: '模板库', path: '/teacher/templates', icon: 'templates' },
  { name: '布置作业', path: '/teacher/assignments/create', icon: 'assignment' },
  { name: '批改作业', path: '/teacher/submissions', icon: 'grading' },
]

const isActive = (path: string) => route.path === path || route.path.startsWith(`${path}/`)

const emit = defineEmits<{
  (e: 'open-statistics'): void
}>()
</script>

<template>
  <aside class="w-[288px] shrink-0 bg-[#F8FAFB] border-r border-[#E2E8F0] flex flex-col h-full">
    <div class="flex-1 flex flex-col justify-center px-6 py-4 gap-6">
      <router-link
        v-for="link in sideLinks"
        :key="link.name"
        :to="link.path"
        :class="[
          'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
          isActive(link.path)
            ? 'bg-[#F4FAEE] text-[#5E9E1A]'
            : 'text-[#475569] hover:bg-[#E2E8F0]/50 hover:text-[#334155]',
        ]"
      >
        <div class="w-6 h-6 flex items-center justify-center">
          <svg v-if="link.icon === 'overview'" width="24" height="16" viewBox="0 0 24 16" fill="none">
            <rect x="1" y="1" width="10" height="6" rx="1" stroke="currentColor" stroke-width="1.5" />
            <rect x="13" y="1" width="10" height="6" rx="1" stroke="currentColor" stroke-width="1.5" />
            <rect x="1" y="9" width="10" height="6" rx="1" stroke="currentColor" stroke-width="1.5" />
            <rect x="13" y="9" width="10" height="6" rx="1" stroke="currentColor" stroke-width="1.5" />
          </svg>
          <svg v-else-if="link.icon === 'content'" width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 4h14v1H2V4Zm0 4h14v1H2V8Zm0 4h10v1H2v-1Zm0 4h12v1H2v-1Z" fill="currentColor" />
          </svg>
          <svg v-else-if="link.icon === 'templates'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 5a2 2 0 0 1 2-2h2v18H6a2 2 0 0 1-2-2V5Z" />
            <path d="M11 3v18h7a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-7Z" />
            <path d="M14 7h3M14 11h3" />
          </svg>
          <svg v-else-if="link.icon === 'assignment'" width="19" height="21" viewBox="0 0 19 21" fill="none">
            <path d="M5 3h9a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="1.5" />
            <path d="M7 1h5v4H7V1Z" stroke="currentColor" stroke-width="1.5" />
            <path d="M6 10h7M6 13h5M6 16h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
          <svg v-else-if="link.icon === 'grading'" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16M4 12h10M4 18h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            <circle cx="18" cy="16" r="4" stroke="currentColor" stroke-width="1.5" />
            <path d="M18 14v2l1.5 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <span>{{ link.name }}</span>
      </router-link>

      <button
        type="button"
        class="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-[#475569] hover:bg-[#E2E8F0]/50 hover:text-[#334155] transition-colors w-full text-left"
        @click="emit('open-statistics')"
      >
        <div class="w-6 h-6 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 3v18h18" />
            <rect x="7" y="12" width="3" height="6" rx="1" />
            <rect x="12" y="8" width="3" height="10" rx="1" />
            <rect x="17" y="5" width="3" height="13" rx="1" />
          </svg>
        </div>
        <span>数据统计</span>
      </button>
    </div>

    <div class="px-6 py-4 border-t border-[#E2E8F0]">
      <button
        type="button"
        class="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#FEF2F2] transition-colors w-full text-left"
        @click="router.push('/login')"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
        <span>退出登录</span>
      </button>
    </div>
  </aside>
</template>
