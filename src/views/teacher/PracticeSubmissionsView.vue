<script setup lang="ts">
import { ref, computed } from 'vue'

interface Submission {
  id: string
  studentName: string
  contentTitle: string
  score: number | null
  status: 'pending' | 'graded'
  submittedAt: string
}

const submissions = ref<Submission[]>([])
const filterClass = ref('all')

const stats = computed(() => ({
  total: submissions.value.length,
  pending: submissions.value.filter(s => s.status === 'pending').length,
  graded: submissions.value.filter(s => s.status === 'graded').length,
  avgScore: submissions.value.reduce((sum, s) => sum + (s.score ?? 0), 0) / (submissions.value.filter(s => s.score != null).length || 1),
}))

const heading = '法语精读1班 · 练习提交'
</script>

<template>
  <div class="p-8 flex flex-col gap-8">
    <div class="flex items-start justify-between">
      <div>
        <h2 class="text-2xl font-black text-[#1F2937] tracking-tight">{{ heading }}</h2>
        <p class="text-sm font-bold text-[#9CA3AF] mt-1">查看和批改学生的德语发音练习</p>
      </div>
      <select
        v-model="filterClass"
        class="px-4 py-2 rounded-lg border border-[#E2E8F0] bg-white text-sm font-bold text-[#475569] outline-none focus:border-[#58CC02]"
      >
        <option value="all">全部班级</option>
        <option value="mock-class-001">法语精读1班</option>
      </select>
    </div>

    <div class="flex gap-8">
      <div class="flex-1 flex flex-col gap-0">
        <div class="bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
          <div class="bg-[#F8FAFC] px-6 py-3 grid grid-cols-5 gap-4">
            <span class="text-xs font-black text-[#64748B] uppercase tracking-wider">学生</span>
            <span class="text-xs font-black text-[#64748B] uppercase tracking-wider">练习内容</span>
            <span class="text-xs font-black text-[#64748B] uppercase tracking-wider">得分</span>
            <span class="text-xs font-black text-[#64748B] uppercase tracking-wider">状态</span>
            <span class="text-xs font-black text-[#64748B] uppercase tracking-wider">提交时间</span>
          </div>

          <div v-if="submissions.length === 0" class="py-20 text-center">
            <div class="w-16 h-16 rounded-full bg-[#F1F5F9] mx-auto flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="1.5"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
            </div>
            <p class="text-sm font-bold text-[#9CA3AF]">暂无提交记录</p>
          </div>

          <div
            v-for="sub in submissions"
            :key="sub.id"
            class="grid grid-cols-5 gap-4 px-6 py-4 border-t border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
          >
            <span class="text-sm font-bold text-[#1F2937]">{{ sub.studentName }}</span>
            <span class="text-sm text-[#64748B]">{{ sub.contentTitle }}</span>
            <span class="text-sm font-bold" :class="sub.score != null ? 'text-[#1F2937]' : 'text-[#9CA3AF]'">{{ sub.score ?? '—' }}</span>
            <span>
              <span
                :class="[
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black',
                  sub.status === 'graded'
                    ? 'bg-[#F2F5E8] text-[#356B00]'
                    : 'bg-[#FFF7ED] text-[#F59E0B]',
                ]"
              >
                {{ sub.status === 'graded' ? '已批改' : '待批改' }}
              </span>
            </span>
            <span class="text-sm text-[#9CA3AF]">{{ sub.submittedAt }}</span>
          </div>
        </div>
      </div>

      <div class="w-[290px] shrink-0 flex flex-col gap-6">
        <div class="bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6 flex flex-col gap-4" style="border-left: 4px solid #01658B;">
          <span class="text-xs font-black text-[#9CA3AF] uppercase tracking-widest">提交总数</span>
          <span class="text-3xl font-black text-[#1F2937]">{{ stats.total }}</span>
        </div>
        <div class="bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6 flex flex-col gap-4" style="border-left: 4px solid #FFB800;">
          <span class="text-xs font-black text-[#9CA3AF] uppercase tracking-widest">待批改</span>
          <span class="text-3xl font-black text-[#1F2937]">{{ stats.pending }}</span>
        </div>
        <div class="bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6 flex flex-col gap-4" style="border-left: 4px solid #356B00;">
          <span class="text-xs font-black text-[#9CA3AF] uppercase tracking-widest">已批改</span>
          <span class="text-3xl font-black text-[#1F2937]">{{ stats.graded }}</span>
        </div>
        <div class="bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6 flex flex-col gap-4" style="border-left: 4px solid #BA1A1A;">
          <span class="text-xs font-black text-[#9CA3AF] uppercase tracking-widest">平均分</span>
          <span class="text-3xl font-black text-[#1F2937]">{{ stats.avgScore.toFixed(1) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
