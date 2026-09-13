<script setup lang="ts">
import { CheckCircle2, PlayCircle } from 'lucide-vue-next'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import type { StudentTaskDetail } from '../../api/endpoints'
import {
  getStudentTaskAvailability,
  studentTaskAvailabilityLabels,
  studentTaskStartButtonLabels,
} from '../../utils/studentTaskAvailability'

const props = defineProps<{
  taskDetail: StudentTaskDetail | null
  selectedTaskId: string | null
  taskDetailLoading: boolean
  taskDetailError: string | null
  attemptCount: number
}>()

defineEmits<{
  (e: 'startTest', taskId: string): void
}>()

const formatType = (type: StudentTaskDetail['task_type']) => {
  return type === 'homework' ? '作业' : '练习'
}

/** 练习模式对应的量词，用于「N 句 / N 词 / N 对」文案 */
const segmentUnit = (task: StudentTaskDetail) => {
  if (task.mode === 'word') return '词'
  if (task.mode === 'pair') return '对'
  return '句'
}

const formatDate = (value: string | null) => {
  if (!value) return '--'
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

const taskWindowStatus = (task: StudentTaskDetail) => getStudentTaskAvailability({
  isActive: task.is_active,
  availableFrom: task.available_from,
  availableUntil: task.available_until,
  maxAttempts: task.max_attempt,
  attemptCount: props.attemptCount,
})

const taskStatusLabel = (task: StudentTaskDetail) => {
  return studentTaskAvailabilityLabels[taskWindowStatus(task)]
}

const taskStatusClass = (task: StudentTaskDetail) => {
  return taskWindowStatus(task) === 'open' ? 'bg-[#EAF0DD] text-[#70C125]' : 'bg-gray-100 text-gray-500'
}

const canStartTask = (task: StudentTaskDetail) => taskWindowStatus(task) === 'open'

const startButtonText = (task: StudentTaskDetail) => {
  return studentTaskStartButtonLabels[taskWindowStatus(task)]
}

const completionLabel = () => props.attemptCount >= 1 ? 'completed' : 'uncompleted'
const completionClass = () => props.attemptCount >= 1 ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
</script>

<template>
  <main class="flex-1 w-full bg-white rounded-[24px] shadow-sm border border-gray-100 p-8">
    <div class="flex items-center gap-3 mb-8">
      <div class="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
        <CheckCircle2 class="w-5 h-5 text-gray-700" />
      </div>
      <h2 class="text-2xl font-black text-gray-900 tracking-tight">任务详情</h2>
    </div>

    <section class="mb-8 rounded-3xl border border-gray-100 bg-[#F8F9FA] p-6">
      <template v-if="taskDetailLoading">
        <SkeletonBlock class="h-7 w-48 mb-4" />
        <SkeletonBlock class="h-20 w-full" />
      </template>

      <div v-else-if="taskDetailError" class="text-sm font-bold text-red-600">
        {{ taskDetailError }}
      </div>

      <div v-else-if="props.taskDetail" class="flex flex-col gap-5">
        <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div class="flex flex-col gap-2">
            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded-full bg-white border border-gray-100 px-3 py-1 text-xs font-black text-[#70C125]">
                {{ formatType(props.taskDetail.task_type) }}
              </span>
              <span
                class="rounded-full px-3 py-1 text-xs font-black"
                :class="taskStatusClass(props.taskDetail)"
              >
                {{ taskStatusLabel(props.taskDetail) }}
              </span>
              <span
                class="rounded-full px-3 py-1 text-xs font-black"
                :class="completionClass()"
              >
                {{ completionLabel() }}
              </span>
            </div>
            <h3 class="text-xl font-black text-gray-900">{{ props.taskDetail.title }}</h3>
            <p v-if="props.taskDetail.notes" class="text-sm font-bold text-gray-500">{{ props.taskDetail.notes }}</p>
          </div>

          <div class="flex flex-col sm:flex-row md:flex-col gap-3 md:min-w-44">
            <div class="rounded-2xl bg-white border border-gray-100 px-4 py-3 flex items-center justify-between gap-4">
              <span class="text-xs font-black text-gray-400">最多提交</span>
              <span class="text-lg font-black text-gray-900">{{ props.taskDetail.max_attempt ?? '--' }} 次</span>
            </div>
            <div class="rounded-2xl bg-white border border-gray-100 px-4 py-3 flex items-center justify-between gap-4">
              <span class="text-xs font-black text-gray-400">已尝试</span>
              <span class="text-lg font-black text-gray-900">{{ props.attemptCount }} 次</span>
            </div>
            <button
              v-if="canStartTask(props.taskDetail)"
              type="button"
              class="rounded-2xl bg-[#70C125] px-5 py-3 text-sm font-black text-white flex items-center justify-center gap-2 border-b-4 border-[#5E9E1A] hover:bg-[#63ad20] active:border-b-0 active:translate-y-1 transition-all"
              @click="$emit('startTest', props.selectedTaskId ?? String(props.taskDetail.task_id))"
            >
              <PlayCircle class="w-5 h-5" />
              进入测试
            </button>
            <button
              v-else
              type="button"
              class="rounded-2xl bg-gray-100 px-5 py-3 text-sm font-black text-gray-400 flex items-center justify-center gap-2 cursor-not-allowed"
              disabled
            >
              <PlayCircle class="w-5 h-5" />
              {{ startButtonText(props.taskDetail) }}
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="rounded-2xl bg-white border border-gray-100 p-4">
            <div class="text-xs font-black text-gray-400 mb-1">所属班级</div>
            <div class="text-sm font-extrabold text-gray-900">
              {{ props.taskDetail.course.map((item) => item.class_name).join('、') || '--' }}
            </div>
          </div>
          <div class="rounded-2xl bg-white border border-gray-100 p-4">
            <div class="text-xs font-black text-gray-400 mb-1">开放时间</div>
            <div class="text-sm font-extrabold text-gray-900">{{ formatDate(props.taskDetail.available_from) }}</div>
          </div>
          <div class="rounded-2xl bg-white border border-gray-100 p-4">
            <div class="text-xs font-black text-gray-400 mb-1">截止时间</div>
            <div class="text-sm font-extrabold text-gray-900">{{ formatDate(props.taskDetail.available_until) }}</div>
          </div>
        </div>

        <div class="rounded-2xl bg-white border border-gray-100 p-4">
          <div class="mb-3 flex items-center justify-between gap-3">
            <div class="text-xs font-black text-gray-400 uppercase tracking-widest">任务文本</div>
            <div class="text-xs font-black text-gray-400">{{ props.taskDetail.segments.length }} {{ segmentUnit(props.taskDetail) }}</div>
          </div>
          <ol class="flex flex-col gap-2">
            <li
              v-for="(segment, index) in props.taskDetail.segments"
              :key="`${index}-${segment}`"
              class="text-sm font-bold leading-relaxed text-gray-700"
            >
              <span class="mr-2 text-gray-400">{{ index + 1 }}.</span>{{ segment }}
            </li>
          </ol>
        </div>
      </div>
    </section>
  </main>
</template>
