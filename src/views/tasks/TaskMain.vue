<script setup lang="ts">
import { Mic, BookA, Headphones, PenLine, ChevronRight, CheckCircle2 } from 'lucide-vue-next'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import type { StudentContentRecordItem } from '../../api/endpoints'

defineProps<{
  loading: boolean
  records: StudentContentRecordItem[]
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
</script>

<template>
  <main class="flex-1 w-full bg-white rounded-[24px] shadow-sm border border-gray-100 p-8">
    <div class="flex items-center gap-3 mb-8">
      <div class="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
        <CheckCircle2 class="w-5 h-5 text-gray-700" />
      </div>
      <h2 class="text-2xl font-black text-gray-900 tracking-tight">练习记录</h2>
    </div>

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
          index !== records.length - 1 ? 'border-b border-gray-100' : ''
        ]"
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
  </main>
</template>
