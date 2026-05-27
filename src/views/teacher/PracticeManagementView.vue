<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { deleteTeacherTask, getTeacherClasses, getTeacherDashboard, getTeacherTasks } from '../../api/endpoints'
import type { TeacherClassItem, TeacherDashboardResponse, TeacherContentItem } from '../../api/endpoints'
import { useAsync } from '../../composables/useAsync'
import { useToast } from '../../composables/useToast'
import ErrorState from '../../components/ErrorState.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'

const router = useRouter()
const toast = useToast()
const dashReq = useAsync<TeacherDashboardResponse>()
const classesReq = useAsync<TeacherClassItem[]>()
const tasksReq = useAsync<TeacherContentItem[]>()
const dashData = ref<TeacherDashboardResponse | null>(null)
const classes = ref<TeacherClassItem[]>([])
const contentList = ref<TeacherContentItem[]>([])
const selectedClassId = ref('all')

onMounted(load)

async function load() {
  const [dashboard, classRows, taskRows] = await Promise.all([
    dashReq.run(() => getTeacherDashboard()),
    classesReq.run(() => getTeacherClasses()),
    tasksReq.run(() => getTeacherTasks()),
  ])
  dashData.value = dashboard
  classes.value = classRows
  contentList.value = taskRows
}

const filteredContentList = computed(() => {
  if (selectedClassId.value === 'all') return contentList.value
  return contentList.value.filter((item) => item.course.some((course) => course.class_id === selectedClassId.value))
})

const removeTask = async (taskId: number) => {
  try {
    await deleteTeacherTask(taskId)
    contentList.value = contentList.value.filter((item) => item.task_id !== taskId)
    toast.push('任务已删除', 'success')
  } catch {
    toast.push('删除失败，请稍后重试', 'error')
  }
}

const formatDate = (value: string | null) => {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

const statCards = [
  { label: '内容总数', key: 'total_content' as const, color: '#01658B' },
  { label: '活跃班级', key: 'total_classes' as const, color: '#356B00' },
  { label: '学生总数', key: 'total_students' as const, color: '#FFB800' },
  { label: '待处理', key: null as null, color: '#BA1A1A', fallback: '-' },
]

const tableHeaders = ['内容标题', '所属班级', '截止时间', '类型', '操作']
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
            <select v-model="selectedClassId" class="bg-transparent outline-none">
              <option value="all">全部班级</option>
              <option v-for="item in classes" :key="item.class_id" :value="item.class_id">
                {{ item.class_name }}
              </option>
            </select>
          </button>
          <button
            type="button"
            class="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F2F5E8] text-sm font-bold text-[#356B00] hover:bg-[#E5EED3] shadow-sm transition-colors"
            @click="router.push('/teacher/assignments/create')"
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
            <tr v-if="filteredContentList.length === 0 && !tasksReq.loading.value">
              <td :colspan="tableHeaders.length" class="text-center py-16 text-sm font-bold text-[#9CA3AF]">
                暂无内容，点击「创建新内容」开始
              </td>
            </tr>
            <tr v-if="tasksReq.loading.value">
              <td :colspan="tableHeaders.length" class="px-6 py-6">
                <SkeletonBlock class="h-10 w-full" />
              </td>
            </tr>
            <tr
              v-for="item in filteredContentList"
              :key="item.task_id"
              class="border-t border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors"
            >
              <td class="px-6 py-4 text-sm font-bold text-[#1F2937]">{{ item.title || '未命名' }}</td>
              <td class="px-6 py-4 text-sm text-[#64748B]">{{ item.course.map((course) => course.class_name).join('、') || '-' }}</td>
              <td class="px-6 py-4 text-sm text-[#64748B]">{{ formatDate(item.available_until) }}</td>
              <td class="px-6 py-4">
                <span
                  :class="[
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black',
                    item.available_until ? 'bg-[#F2F5E8] text-[#356B00]' : 'bg-[#F1F5F9] text-[#94A3B8]',
                  ]"
                >
                  {{ item.task_type === 'homework' ? '作业' : '练习' }} · {{ item.segments.length }} 句
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <button
                    class="text-xs font-bold text-[#356B00] hover:underline"
                    @click="router.push({ path: '/teacher/submissions', query: { taskId: item.task_id, classId: selectedClassId === 'all' ? item.course[0]?.class_id : selectedClassId } })"
                  >
                    查看
                  </button>
                  <button class="text-xs font-bold text-[#BA1A1A] hover:underline" @click="removeTask(item.task_id)">删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="flex items-center justify-between px-6 py-4 border-t border-[#F1F5F9] bg-[rgba(248,250,252,0.5)]">
          <span class="text-sm text-[#64748B] font-bold">共 {{ filteredContentList.length }} 项</span>
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
