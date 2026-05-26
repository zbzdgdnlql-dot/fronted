<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const filterText = ref('')

interface PracticeExercise {
  id: string
  title: string
  mode: string
  sentenceCount: number
  createdAt: string
  status: 'published' | 'draft'
}

const exercises = ref<PracticeExercise[]>([])

const statusLabels: Record<string, string> = { published: '已发布', draft: '草稿' }
const statusColors: Record<string, string> = { published: 'bg-[#F2F5E8] text-[#356B00]', draft: 'bg-[#F1F5F9] text-[#64748B]' }
</script>

<template>
  <div class="p-8 flex flex-col gap-8">
    <div class="flex flex-col gap-2">
      <h2 class="text-2xl font-black text-[#1F2937] tracking-tight">练习管理</h2>
      <p class="text-sm font-bold text-[#9CA3AF]">布置和编辑德语发音练习</p>
    </div>

    <div class="bg-white rounded-lg border border-[#F1F5F9] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6">
      <div class="flex items-center gap-4">
        <div class="relative flex-1 max-w-md">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
          <input
            v-model="filterText"
            type="text"
            placeholder="搜索练习..."
            class="w-full pl-10 pr-4 py-2 rounded-lg border border-[#E2E8F0] text-sm font-bold text-[#1F2937] placeholder-[#9CA3AF] outline-none focus:border-[#58CC02] focus:ring-1 focus:ring-[#58CC02]/20 transition-all"
          />
        </div>
        <button
          type="button"
          class="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#356B00] text-white text-sm font-bold hover:bg-[#2E5E00] shadow-sm transition-colors"
          @click="router.push('/teacher/assignments/create')"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
          新建练习
        </button>
      </div>
    </div>

    <div class="flex flex-col gap-4">
      <h3 class="text-base font-black text-[#1F2937]">练习列表</h3>

      <div v-if="exercises.length === 0" class="flex flex-col items-center gap-4 py-12">
        <div class="w-20 h-20 rounded-full bg-[#F1F5F9] flex items-center justify-center">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="1.5" stroke-linecap="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
            <path d="M14 2v6h6M12 18v-6M9 15h6" />
          </svg>
        </div>
        <div class="text-center">
          <p class="text-sm font-black text-[#64748B]">还没有练习内容</p>
          <p class="text-xs font-bold text-[#9CA3AF] mt-1">点击「新建练习」来创建你的第一个德语发音练习</p>
        </div>
      </div>

      <div
        v-for="exercise in exercises"
        :key="exercise.id"
        class="flex items-center justify-between bg-white rounded-lg border border-[#F1F5F9] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6 hover:border-[#58CC02]/20 transition-colors"
      >
        <div class="flex flex-col gap-1">
          <h4 class="text-sm font-black text-[#1F2937]">{{ exercise.title }}</h4>
          <p class="text-xs font-bold text-[#9CA3AF]">{{ exercise.sentenceCount }} 个句子 · {{ exercise.createdAt }}</p>
        </div>
        <div class="flex items-center gap-3">
          <span :class="['inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black', statusColors[exercise.status]]">
            {{ statusLabels[exercise.status] }}
          </span>
          <button class="text-xs font-bold text-[#356B00] hover:underline">编辑</button>
        </div>
      </div>
    </div>
  </div>
</template>
