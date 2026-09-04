<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getTeacherDashboard } from '../../api/endpoints'
import type { TeacherDashboardResponse } from '../../api/endpoints'
import { useAsync } from '../../composables/useAsync'
import ErrorState from '../../components/ErrorState.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'

const router = useRouter()
const req = useAsync<TeacherDashboardResponse>()
const data = ref<TeacherDashboardResponse | null>(null)

async function load() {
  const r = await req.run(async () => getTeacherDashboard())
  if (r) data.value = r
}

onMounted(load)

const statCards = [
  { label: '班级总数', key: 'total_classes' as const, color: '#01658B' },
  { label: '学生总数', key: 'total_students' as const, color: '#356B00' },
  { label: '内容总数', key: 'total_content' as const, color: '#FFB800' },
  { label: '待批改', key: null as null, color: '#BA1A1A', fallback: 0 },
]

const quickActions = [
  { label: '发布内容', path: '/teacher/content', icon: 'content' },
  { label: '布置作业', path: '/teacher/content', icon: 'assignment' },
  { label: '批改作业', path: '/teacher/submissions', icon: 'grading' },
]
</script>

<template>
  <div class="p-6 flex flex-col gap-8">
    <ErrorState
      v-if="req.error.value"
      :message="req.error.value"
      :busy="req.loading.value"
      @retry="load()"
    />

    <template v-else>
      <div class="flex flex-col gap-2">
        <h2 class="text-2xl font-black text-[#1F2937] tracking-tight">概览</h2>
        <p class="text-sm font-bold text-[#9CA3AF]">欢迎回来，查看你的教学数据</p>
      </div>

      <div class="grid grid-cols-4 gap-0">
        <div
          v-for="card in statCards"
          :key="card.label"
          class="bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6 flex items-center gap-[132px]"
          :style="{ borderLeft: `4px solid ${card.color}` }"
        >
          <div class="flex flex-col gap-2">
            <span class="text-xs font-black text-[#9CA3AF] uppercase tracking-widest">{{ card.label }}</span>
            <span class="text-3xl font-black text-[#1F2937]">
              <SkeletonBlock v-if="req.loading.value" class="w-12 h-8 rounded" />
              <template v-else>
                {{ card.key ? (data as any)?.[card.key] ?? '-' : card.fallback }}
              </template>
            </span>
          </div>
          <div
            class="w-12 h-12 rounded-full flex items-center justify-center"
            :style="{ backgroundColor: `${card.color}1A` }"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" :stroke="card.color" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-6">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-black text-[#1F2937]">快速操作</h3>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <button
            v-for="action in quickActions"
            :key="action.label"
            type="button"
            class="bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6 flex flex-col items-center gap-3 hover:shadow-[0px_4px_20px_rgba(0,0,0,0.08)] transition-shadow border border-transparent hover:border-[#58CC02]/20"
            @click="router.push(action.path)"
          >
            <div class="w-12 h-12 rounded-full bg-[#F2F5E8] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#356B00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path v-if="action.icon === 'content'" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                <path v-if="action.icon === 'content'" d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                <template v-else-if="action.icon === 'assignment'">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" />
                </template>
                <template v-else>
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </template>
              </svg>
            </div>
            <span class="text-sm font-black text-[#1F2937]">{{ action.label }}</span>
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
