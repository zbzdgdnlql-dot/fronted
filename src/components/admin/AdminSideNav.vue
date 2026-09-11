<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LayoutDashboard, School, Users, GraduationCap, Plus, UserPlus, LogOut } from 'lucide-vue-next'
import { logout as apiLogout } from '../../api/endpoints'
import { useToast } from '../../composables/useToast'
import { useAuth } from '../../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuth()
const toast = useToast()

const sideLinks = [
  { name: '总览', path: '/admin/overview', icon: LayoutDashboard },
  { name: '班级管理', path: '/admin/classes', icon: School },
  { name: '教师管理', path: '/admin/teachers', icon: Users },
  { name: '学生管理', path: '/admin/students', icon: GraduationCap },
]

const isActive = (path: string) => route.path === path || route.path.startsWith(`${path}/`)

const isTeacherSection = computed(() => route.path.startsWith('/admin/teachers'))

const createLabel = computed(() => (isTeacherSection.value ? '创建教师' : '创建班级'))
const createIcon = computed(() => (isTeacherSection.value ? UserPlus : Plus))
const createTarget = computed(() => (isTeacherSection.value ? '/admin/teachers/create' : '/admin/classes/create'))

const goCreate = () => {
  router.push(createTarget.value)
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
  <aside class="w-[288px] shrink-0 bg-[#F8FAFB] border-r border-[#E2E8F0] flex flex-col h-full">
    <div class="flex items-center gap-3 px-6 pt-6 pb-4">
      <div class="w-12 h-12 rounded-2xl bg-[#70C125] flex items-center justify-center text-white font-black text-lg shrink-0">
        管
      </div>
      <div class="flex flex-col min-w-0">
        <span class="text-sm font-black text-[#3C3C3C] truncate">管理员</span>
        <span class="text-xs font-bold text-[#9CA3AF]">系统管理员</span>
      </div>
    </div>

    <div class="h-px bg-[#E2E8F0] mx-6" />

    <nav class="flex-1 flex flex-col gap-1 px-4 py-4 overflow-y-auto">
      <router-link
        v-for="link in sideLinks"
        :key="link.name"
        :to="link.path"
        :class="[
          'flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-bold transition-colors',
          isActive(link.path)
            ? 'bg-[#F4FAEE] text-[#5E9E1A]'
            : 'text-[#475569] hover:bg-[#E2E8F0]/50 hover:text-[#334155]',
        ]"
      >
        <component :is="link.icon" class="w-5 h-5 shrink-0" />
        <span>{{ link.name }}</span>
      </router-link>
    </nav>

    <div class="px-6 py-4 border-t border-[#E2E8F0] flex flex-col gap-3">
      <button
        type="button"
        class="w-full flex items-center justify-center gap-2 bg-[#70C125] text-white font-black text-sm py-3 rounded-2xl border-b-4 border-[#5E9E1A] hover:brightness-105 active:border-b-2 active:translate-y-0.5 transition-all"
        @click="goCreate"
      >
        <component :is="createIcon" class="w-4 h-4" />
        <span>{{ createLabel }}</span>
      </button>

      <button
        type="button"
        class="w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-bold text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#FEF2F2] transition-colors text-left"
        @click="onLogout"
      >
        <LogOut class="w-5 h-5 shrink-0" />
        <span>退出登录</span>
      </button>
    </div>
  </aside>
</template>
