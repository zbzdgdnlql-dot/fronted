<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getTeacherDashboard, getTeacherClassContents } from '../../api/endpoints'
import type { TeacherDashboardResponse, TeacherContentItem } from '../../api/endpoints'
import { useAsync } from '../../composables/useAsync'
import ErrorState from '../../components/ErrorState.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'

const router = useRouter()
const dashReq = useAsync<TeacherDashboardResponse>()
const dashData = ref<TeacherDashboardResponse | null>(null)
const contentList = ref<TeacherContentItem[]>([])

onMounted(load)

async function load() {
  dashData.value = await dashReq.run(async () => getTeacherDashboard())
  if (dashData.value) {
    try {
      const res = await getTeacherClassContents('mock-class-001')
      contentList.value = res.content_list ?? []
    } catch {}
  }
}

const statCards = [
  { label: '内容总数', key: 'total_content' as const, color: '#01658B' },
  { label: '活跃班级', key: 'total_classes' as const, color: '#356B00' },
  { label: '学生总数', key: 'total_students' as const, color: '#FFB800' },
  { label: '待处理', key: null as null, color: '#BA1A1A', fallback: '-' },
]

const tableHeaders = ['内容标题', '创建时间', '更新时间', '状态', '操作']
</script>

<template>
  <div class="p-6 flex flex-col gap-[22px]">
    <ErrorState
      v-if="dashReq.error.value"
      :message="dashReq.error.value"
      :busy="dashReq.loading.value"
      @retry="load()"
    />

    <template v-else>
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-black text-[#1F2937] tracking-tight">内容管理</h2>
          <p class="text-sm font-bold text-[#9CA3AF] mt-1">管理和发布教学练习内容</p>
        </div>
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E2E8F0] bg-white text-sm font-bold text-[#475569] hover:bg-[#F8FAFC] shadow-sm transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            筛选班级
          </button>
          <button
            type="button"
            class="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F2F5E8] text-sm font-bold text-[#356B00] hover:bg-[#E5EED3] shadow-sm transition-colors"
            @click="router.push('/teacher/exercise')"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
            创建新内容
          </button>
          <button
            type="button"
            class="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#356B00] text-white text-sm font-bold hover:bg-[#2E5E00] shadow-sm transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
            导入
          </button>
        </div>
      </div>

      <div class="grid grid-cols-4 gap-0">
        <div
          v-for="card in statCards"
          :key="card.label"
          class="bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6 flex items-center justify-between"
          :style="{ borderLeft: `4px solid ${card.color}` }"
        >
          <div class="flex flex-col gap-2">
            <span class="text-xs font-black text-[#9CA3AF] uppercase tracking-widest">{{ card.label }}</span>
            <span class="text-3xl font-black text-[#1F2937]">
              <SkeletonBlock v-if="dashReq.loading.value" class="w-12 h-8 rounded" />
              <template v-else>{{ card.key ? (dashData as any)?.[card.key] ?? '-' : card.fallback }}</template>
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

      <div class="bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9]">
          <h3 class="text-base font-black text-[#1F2937]">内容列表</h3>
          <div class="flex items-center gap-2">
            <button class="text-sm font-bold text-[#9CA3AF] hover:text-[#1F2937] transition-colors">导出</button>
          </div>
        </div>

        <table class="w-full">
          <thead>
            <tr class="bg-[#F8FAFC]">
              <th v-for="h in tableHeaders" :key="h" class="text-left px-6 py-3 text-xs font-black text-[#64748B] uppercase tracking-wider">
                {{ h }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="contentList.length === 0 && !dashReq.loading.value">
              <td :colspan="tableHeaders.length" class="text-center py-16 text-sm font-bold text-[#9CA3AF]">
                暂无内容，点击「创建新内容」开始
              </td>
            </tr>
            <tr
              v-for="item in contentList"
              :key="item.content_id"
              class="border-t border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors"
            >
              <td class="px-6 py-4 text-sm font-bold text-[#1F2937]">{{ item.title || '未命名' }}</td>
              <td class="px-6 py-4 text-sm text-[#64748B]">{{ item.created_at?.slice(0, 10) || '-' }}</td>
              <td class="px-6 py-4 text-sm text-[#64748B]">{{ item.updated_at?.slice(0, 10) || '-' }}</td>
              <td class="px-6 py-4">
                <span
                  :class="[
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black',
                    item.is_active ? 'bg-[#F2F5E8] text-[#356B00]' : 'bg-[#F1F5F9] text-[#94A3B8]',
                  ]"
                >
                  {{ item.is_active ? '活跃' : '停用' }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <button class="text-xs font-bold text-[#356B00] hover:underline">编辑</button>
                  <button class="text-xs font-bold text-[#94A3B8] hover:text-[#475569]">查看</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="flex items-center justify-between px-6 py-4 border-t border-[#F1F5F9] bg-[rgba(248,250,252,0.5)]">
          <span class="text-sm text-[#64748B] font-bold">共 {{ contentList.length }} 项</span>
          <div class="flex items-center gap-2">
            <button class="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold text-[#9CA3AF] hover:bg-[#F1F5F9] disabled:opacity-30" disabled>‹</button>
            <button class="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold bg-[#F2F5E8] text-[#356B00]">1</button>
            <button class="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold text-[#9CA3AF] hover:bg-[#F1F5F9] disabled:opacity-30" disabled>›</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
