<script setup lang="ts">
import { BookOpen, ListTodo, ChevronRight } from 'lucide-vue-next'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import type { StudentTaskItem } from '../../api/endpoints'
import {
  getStudentTaskAvailability,
  getStudentTaskAvailabilityFromApi,
  studentTaskAvailabilityLabels,
} from '../../utils/studentTaskAvailability'

defineProps<{
  items: StudentTaskItem[]
  loading: boolean
  selectedTaskId: string | null
}>()

defineEmits<{
  (e: 'select', taskId: string): void
}>()

// 优先采用后端权威 task_status（列表接口不返回 available_until，本地无法推算过期状态），
// 缺失时再回退到本地按时间窗推算，保证与右侧详情页状态一致。
const taskWindowStatus = (item: StudentTaskItem) =>
  getStudentTaskAvailabilityFromApi(item.task_status) ??
  getStudentTaskAvailability({
    isActive: item.is_active,
    availableFrom: item.available_from,
    availableUntil: item.available_until,
    maxAttempts: item.max_submission,
    attemptCount: item.attempt_count,
  })

const taskStatusLabel = (item: StudentTaskItem) => {
  return studentTaskAvailabilityLabels[taskWindowStatus(item)]
}

const taskStatusClass = (item: StudentTaskItem) => {
  return taskWindowStatus(item) === 'open' ? 'bg-[#EAF0DD] text-[#70C125]' : 'bg-gray-100 text-gray-500'
}

const attemptCount = (item: StudentTaskItem) => item.attempt_count ?? 0
const completionLabel = (item: StudentTaskItem) => attemptCount(item) >= 1 ? 'completed' : 'uncompleted'
const completionClass = (item: StudentTaskItem) => {
  return attemptCount(item) >= 1 ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
}
</script>

<template>
  <aside class="w-full xl:w-[320px] flex flex-col gap-6 shrink-0">
    <!-- Class Content Section -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
          <BookOpen class="w-4 h-4 text-[#70C125]" />
        </div>
        <h3 class="text-lg font-extrabold text-gray-900">班级内容</h3>
      </div>

      <div class="flex flex-col gap-3">
        <template v-if="loading">
          <SkeletonBlock class="h-20 w-full" />
          <SkeletonBlock class="h-20 w-full" />
          <SkeletonBlock class="h-20 w-full" />
        </template>

        <template v-else>
          <button
            v-for="item in items"
            :key="item.task_id"
            type="button"
            :class="[
              'p-4 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden text-left',
              item.task_id === selectedTaskId ? 'border-[#70C125] bg-[#F8FAFB]' : 'border-gray-100 bg-white hover:border-gray-200'
            ]"
            @click="$emit('select', item.task_id)"
          >
            <div v-if="item.task_id === selectedTaskId" class="absolute left-0 top-0 bottom-0 w-1 bg-[#70C125]"></div>

            <h4 class="text-[15px] font-bold text-gray-900 mb-3">{{ item.title }}</h4>

            <div class="flex items-center justify-between gap-3 flex-wrap">
              <span
                class="px-2 py-0.5 rounded text-xs font-black"
                :class="taskStatusClass(item)"
              >
                {{ taskStatusLabel(item) }}
              </span>
              <span
                class="px-2 py-0.5 rounded text-xs font-black"
                :class="completionClass(item)"
              >
                {{ completionLabel(item) }}
              </span>
              <span class="text-xs font-medium text-gray-500">平均分: {{ item.avg_score < 0 ? '--' : item.avg_score.toFixed(1) }}</span>
              <span class="text-xs font-black text-gray-400">已尝试 {{ attemptCount(item) }} 次</span>
            </div>
          </button>
        </template>
      </div>
    </div>

    <!-- Chapters Section -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex-1">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
          <ListTodo class="w-4 h-4 text-blue-500" />
        </div>
        <h3 class="text-lg font-extrabold text-gray-900">课程章节</h3>
      </div>

      <div class="flex flex-col gap-2">
        <button 
          v-for="n in 3"
          :key="n"
          class="flex items-center justify-between p-3 rounded-xl transition-all text-left w-full group bg-white border border-gray-100 opacity-70 cursor-not-allowed"
          disabled
        >
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black bg-gray-100 text-gray-500">
              {{ n }}
            </div>
            <span class="text-[15px] font-bold text-gray-700">章节功能待接入</span>
          </div>
          
          <ChevronRight class="w-4 h-4 text-gray-300" />
        </button>
        <!-- TODO: 接入章节/单元学习相关接口（当前后端文档未提供对应 student unit_learning API）。 -->
      </div>
    </div>
  </aside>
</template>
