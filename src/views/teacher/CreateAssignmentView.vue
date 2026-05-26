<script setup lang="ts">
import { ref } from 'vue'
const title = ref('')
const contentText = ref('')
const maxSubmissions = ref(3)
const selectedMode = ref('sentence')
const segmentedSentences = ref<string[]>([])

const modes = [
  { id: 'sentence', label: '单句模式', desc: '逐句拆分，逐句练习发音' },
  { id: 'paragraph', label: '段落模式', desc: '按段落组织，适合长篇练习' },
  { id: 'dialog', label: '对话模式', desc: '角色扮演，双人对话练习' },
]

const onSegment = () => {
  if (!contentText.value.trim()) return
  segmentedSentences.value = contentText.value
    .split(/[.!?。！？\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
}

const onSaveDraft = () => {} // TODO: 对接 teacher/class/<classId>/content POST
const onPublish = () => {} // TODO: 对接 teacher/class/<classId>/content POST
</script>

<template>
  <div class="p-8 flex gap-6">
    <div class="flex-1 flex flex-col gap-6">
      <div class="flex flex-col gap-6">
        <div class="grid grid-cols-3 gap-0">
          <div
            v-for="mode in modes"
            :key="mode.id"
            :class="[
              'bg-white rounded-xl p-6 flex flex-col gap-2 cursor-pointer transition-colors border shadow-[0px_4px_20px_rgba(0,0,0,0.04)]',
              selectedMode === mode.id
                ? 'border-[#356B00] border-2'
                : 'border-[#F1F5F9] hover:border-[#58CC02]/20',
            ]"
            @click="selectedMode = mode.id"
          >
            <h3 class="text-sm font-black text-[#1F2937]">{{ mode.label }}</h3>
            <p class="text-xs font-bold text-[#9CA3AF]">{{ mode.desc }}</p>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-[#F1F5F9] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6 flex flex-col gap-6">
          <div class="flex items-center gap-3">
            <span class="text-sm font-black text-[#1F2937]">内容文本</span>
            <span class="text-xs font-bold text-[#9CA3AF]">输入德语课文或对话内容</span>
          </div>
          <textarea
            v-model="contentText"
            class="w-full h-40 rounded-xl border border-[#E2E8F0] p-4 text-sm text-[#1F2937] placeholder-[#9CA3AF] outline-none focus:border-[#58CC02] resize-none"
            placeholder="请输入德语内容文本..."
            @input="onSegment"
          />
        </div>

        <div class="bg-white rounded-xl border border-[#F1F5F9] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6 flex flex-col gap-6">
          <div class="flex flex-col gap-4">
            <h3 class="text-sm font-black text-[#1F2937]">分句结果</h3>
            <div class="flex items-center gap-2">
              <input
                v-model="title"
                type="text"
                placeholder="练习标题"
                class="flex-1 px-4 py-2 rounded-lg border border-[#E2E8F0] text-sm font-bold text-[#1F2937] placeholder-[#9CA3AF] outline-none focus:border-[#58CC02]"
              />
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-[#9CA3AF]">最大提交次数</span>
                <input
                  v-model.number="maxSubmissions"
                  type="number"
                  min="1"
                  max="99"
                  class="w-16 px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-center font-bold text-[#1F2937] outline-none focus:border-[#58CC02]"
                />
              </div>
            </div>
          </div>

          <div v-if="segmentedSentences.length === 0" class="flex items-center justify-center py-8">
            <p class="text-sm font-bold text-[#9CA3AF]">输入文本后将自动分句</p>
          </div>
          <div v-else class="flex flex-col gap-2">
            <div
              v-for="(sentence, idx) in segmentedSentences"
              :key="idx"
              class="flex items-center gap-3 px-4 py-2 bg-[#F8FAFC] rounded-lg"
            >
              <span class="text-xs font-black text-[#9CA3AF] w-8 shrink-0">#{{ idx + 1 }}</span>
              <span class="text-sm font-bold text-[#1F2937]">{{ sentence }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="w-[320px] shrink-0 flex flex-col gap-5">
      <div class="bg-white rounded-xl border border-[#F1F5F9] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6 flex flex-col gap-6">
        <div class="flex items-center gap-3">
          <span class="text-sm font-black text-[#1F2937]">班级信息</span>
        </div>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-[#F2F5E8] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#356B00" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          </div>
          <div>
            <p class="text-sm font-black text-[#1F2937]">法语精读1班</p>
            <p class="text-xs font-bold text-[#9CA3AF]">25名学生</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-[#F1F5F9] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6 flex flex-col gap-4">
        <h3 class="text-sm font-black text-[#1F2937]">句子概览</h3>
        <div v-if="segmentedSentences.length === 0" class="text-center py-4">
          <p class="text-xs font-bold text-[#9CA3AF]">暂无分句</p>
        </div>
        <div v-else class="flex flex-col gap-4">
          <div
            v-for="(sentence, idx) in segmentedSentences"
            :key="idx"
            class="flex items-start gap-2"
          >
            <span class="text-xs font-black text-[#356B00] bg-[#F2F5E8] rounded-full w-5 h-5 flex items-center justify-center shrink-0">{{ idx + 1 }}</span>
            <p class="text-xs text-[#64748B] leading-relaxed line-clamp-2">{{ sentence }}</p>
          </div>
        </div>
        <div v-if="segmentedSentences.length > 0" class="bg-[rgba(53,107,0,0.05)] rounded-xl border border-[rgba(53,107,0,0.1)] p-4 text-xs font-bold text-[#356B00]">
          {{ segmentedSentences.length }} 个句子 · 模式：{{ modes.find(m => m.id === selectedMode)?.label }}
        </div>
      </div>

      <button
        type="button"
        class="w-full bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] py-4 text-center text-sm font-bold text-[#334155] hover:bg-[#F8FAFC] transition-colors"
        @click="onSaveDraft"
      >
        保存为草稿
      </button>

      <button
        type="button"
        class="w-full bg-[#356B00] rounded-xl shadow-[0px_2px_4px_-2px_rgba(0,0,0,0.1),0px_4px_6px_-1px_rgba(0,0,0,0.1)] py-4 text-center text-sm font-bold text-white hover:bg-[#2E5E00] transition-colors"
        @click="onPublish"
      >
        保存并发布
      </button>
    </div>
  </div>
</template>
