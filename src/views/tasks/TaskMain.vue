<script setup lang="ts">
import { Mic, BookA, Headphones, PenLine, ChevronRight, CheckCircle2, PlayCircle } from 'lucide-vue-next'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import type { StudentSessionEvaluationItem, StudentTaskDetail, StudentTaskRecordItem } from '../../api/endpoints'

const props = defineProps<{
  loading: boolean
  taskDetail: StudentTaskDetail | null
  taskDetailLoading: boolean
  taskDetailError: string | null
  records: StudentTaskRecordItem[]
  selectedSessionId: string | null
  details: StudentSessionEvaluationItem[]
  detailsLoading: boolean
  detailsError: string | null
}>()

defineEmits<{
  (e: 'selectRecord', sessionId: string): void
  (e: 'startTest', taskId: number): void
}>()

const iconFor = (i: number) => {
  const icons = [Mic, BookA, Headphones, PenLine]
  return icons[i % icons.length]
}

const iconTone = (i: number) => {
  const tones = [
    { iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    { iconBg: 'bg-pink-100', iconColor: 'text-pink-600' },
    { iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
    { iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
  ]
  return tones[i % tones.length]
}

const formatType = (type: StudentTaskDetail['task_type']) => {
  return type === 'homework' ? '作业' : '练习'
}

const formatDate = (value: string | null) => {
  if (!value) return '--'
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}
</script>

<template>
  <main class="flex-1 w-full bg-white rounded-[24px] shadow-sm border border-gray-100 p-8">
    <div class="flex items-center gap-3 mb-8">
      <div class="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
        <CheckCircle2 class="w-5 h-5 text-gray-700" />
      </div>
      <h2 class="text-2xl font-black text-gray-900 tracking-tight">练习记录</h2>
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
                :class="props.taskDetail.is_active ? 'bg-[#EAF0DD] text-[#70C125]' : 'bg-gray-100 text-gray-500'"
              >
                {{ props.taskDetail.is_active ? '进行中' : '未启用' }}
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
            <button
              v-if="props.taskDetail.is_active"
              type="button"
              class="rounded-2xl bg-[#70C125] px-5 py-3 text-sm font-black text-white flex items-center justify-center gap-2 border-b-4 border-[#5E9E1A] hover:bg-[#63ad20] active:border-b-0 active:translate-y-1 transition-all"
              @click="$emit('startTest', props.taskDetail.task_id)"
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
              暂未开始
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
            <div class="text-xs font-black text-gray-400">{{ props.taskDetail.segments.length }} 句</div>
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

    <div class="flex flex-col">
      <template v-if="loading">
        <SkeletonBlock class="h-20 w-full mb-3" />
        <SkeletonBlock class="h-20 w-full mb-3" />
        <SkeletonBlock class="h-20 w-full mb-3" />
      </template>

      <template v-else-if="!records.length">
        <div class="bg-[#F8F9FA] border border-gray-100 rounded-3xl p-6 text-sm font-bold text-gray-500">
          暂无记录
        </div>
      </template>

      <div
        v-else
        v-for="(record, index) in records"
        :key="record.session_id"
        :class="[
          'flex items-center justify-between py-6 transition-colors hover:bg-gray-50 rounded-2xl px-4 -mx-4 group cursor-pointer',
          index !== records.length - 1 ? 'border-b border-gray-100' : '',
          record.session_id === selectedSessionId ? 'bg-[#F8FAFB]' : ''
        ]"
        @click="$emit('selectRecord', record.session_id)"
      >
        <div class="flex items-center gap-5">
          <div :class="['w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm', iconTone(index).iconBg]">
            <component :is="iconFor(index)" :class="['w-6 h-6', iconTone(index).iconColor]" />
          </div>

          <div class="flex flex-col gap-1.5">
            <h4 class="text-lg font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors">
              {{ record.title }}
            </h4>
            <span class="text-sm font-bold text-gray-400">
              {{ record.completed_at || record.created_at }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-8">
          <div class="flex flex-col items-end gap-1">
            <span class="text-xl font-black text-[#70C125]">
              {{ Number.isFinite(record.average_score) ? record.average_score.toFixed(1) : '--' }}
            </span>
            <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">
              平均分
            </span>
          </div>

          <div class="px-4 py-2 rounded-full flex items-center gap-2 bg-[#EAF0DD] text-[#70C125]">
            <CheckCircle2 class="w-4 h-4" />
            <span class="text-sm font-bold">已完成</span>
          </div>

          <div class="w-10 h-10 rounded-full border-2 border-gray-100 flex items-center justify-center group-hover:border-blue-200 group-hover:bg-blue-50 transition-colors">
            <ChevronRight class="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </div>
        </div>
      </div>
    </div>

    <section class="mt-8 border-t border-gray-100 pt-8">
      <div class="flex items-center justify-between gap-4 mb-5">
        <h3 class="text-lg font-black text-gray-900">句子评测明细</h3>
        <span class="rounded-full bg-gray-100 px-4 py-1.5 text-xs font-black text-gray-500">
          {{ details.length }} 个句子
        </span>
      </div>

      <template v-if="detailsLoading">
        <SkeletonBlock class="h-24 w-full mb-3" />
        <SkeletonBlock class="h-24 w-full mb-3" />
      </template>

      <div v-else-if="detailsError" class="bg-red-50 border border-red-100 rounded-3xl p-6 text-sm font-bold text-red-700">
        {{ detailsError }}
      </div>

      <div v-else-if="!selectedSessionId" class="bg-[#F8F9FA] border border-gray-100 rounded-3xl p-6 text-sm font-bold text-gray-500">
        选择一条练习记录后查看句子得分。
      </div>

      <div v-else-if="!details.length" class="bg-[#F8F9FA] border border-gray-100 rounded-3xl p-6 text-sm font-bold text-gray-500">
        这条记录暂无句子明细。
      </div>

      <div v-else class="flex flex-col gap-4">
        <article
          v-for="item in details"
          :key="item.eval_id"
          class="rounded-3xl border border-gray-100 bg-[#F8F9FA] p-5 flex flex-col gap-4"
        >
          <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            <div class="flex flex-col gap-2">
              <span class="text-xs font-black text-gray-400 uppercase tracking-widest">第 {{ item.line_number }} 句</span>
              <p class="text-base font-extrabold leading-relaxed text-gray-900">{{ item.sentence_text }}</p>
            </div>
            <div class="shrink-0 rounded-2xl bg-white border border-gray-100 px-5 py-3 text-center">
              <div class="text-2xl font-black text-[#70C125]">{{ item.total_score.toFixed(1) }}</div>
              <div class="text-xs font-black text-gray-400 uppercase tracking-widest">总分</div>
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div class="rounded-2xl bg-white border border-gray-100 p-3">
              <div class="text-xs font-black text-gray-400 mb-1">发音</div>
              <div class="text-lg font-black text-gray-900">{{ item.pronunciation.toFixed(1) }}</div>
            </div>
            <div class="rounded-2xl bg-white border border-gray-100 p-3">
              <div class="text-xs font-black text-gray-400 mb-1">节奏</div>
              <div class="text-lg font-black text-gray-900">{{ item.rhythm.toFixed(1) }}</div>
            </div>
            <div class="rounded-2xl bg-white border border-gray-100 p-3">
              <div class="text-xs font-black text-gray-400 mb-1">流畅</div>
              <div class="text-lg font-black text-gray-900">{{ item.fluency.toFixed(1) }}</div>
            </div>
            <div class="rounded-2xl bg-white border border-gray-100 p-3">
              <div class="text-xs font-black text-gray-400 mb-1">完整</div>
              <div class="text-lg font-black text-gray-900">{{ item.completeness.toFixed(1) }}</div>
            </div>
          </div>

          <p v-if="item.teacher_notes" class="text-sm font-bold text-gray-500">教师评语：{{ item.teacher_notes }}</p>
        </article>
      </div>
    </section>
  </main>
</template>
