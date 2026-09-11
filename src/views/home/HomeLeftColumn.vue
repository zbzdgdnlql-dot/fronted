<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useHomeEvaluation } from './useHomeEvaluation'
import { useToast } from '../../composables/useToast'

const {
  textContent,
  sentences,
  activeIndex,
  results,
  recording,
  analyzing,
  recordingElapsedMs,
  canRecord,
  canStopRecording,
  currentSentence,
  progressPercent,
  splitSentences,
  selectSentence,
  startRecording,
  stopRecording,
  cleanup,
} = useHomeEvaluation()

const clearText = () => {
  textContent.value = ''
}

const toast = useToast()
const fileInput = ref<HTMLInputElement | null>(null)
const importText = () => {
  fileInput.value?.click()
}
const onFileSelected = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    const text = typeof reader.result === 'string' ? reader.result : ''
    if (text.trim()) {
      textContent.value = text
      toast.push('文本已导入，点击「智能分句」开始评测', 'success')
    } else {
      toast.push('导入的文本内容为空', 'warning')
    }
  }
  reader.onerror = () => toast.push('文本读取失败，请重试', 'error')
  reader.readAsText(file, 'utf-8')
  input.value = ''
}

const statusText = (status: string) => {
  const labels: Record<string, string> = {
    pending: '待录音',
    recording: '录音中',
    analyzing: '评测中',
    done: '已完成',
    error: '需重试',
  }
  return labels[status] ?? status
}

const statusClass = (status: string) => {
  const classes: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-500',
    recording: 'bg-red-50 text-red-600',
    analyzing: 'bg-blue-50 text-blue-600',
    done: 'bg-[#EAF0DD] text-[#70C125]',
    error: 'bg-orange-50 text-orange-600',
  }
  return classes[status] ?? 'bg-gray-100 text-gray-500'
}

const recordingLabel = () => {
  if (analyzing.value) return '评测中…'
  if (recording.value) return `${(recordingElapsedMs.value / 1000).toFixed(1)}s`
  return '开始录音'
}

onUnmounted(() => {
  cleanup()
})
</script>

<template>
  <div class="flex flex-col h-full min-h-0">
    <!-- Top Box: Textarea Area -->
    <div class="bg-white rounded-[32px] p-6 border-2 border-gray-100 shadow-sm flex flex-col flex-1 min-h-0">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4 shrink-0">
        <h2 class="text-xl font-black text-gray-900">评测文本</h2>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="text-sm font-bold text-[#70C125] hover:text-[#63ad20] transition-colors"
            @click="importText"
          >
            导入文本
          </button>
          <button
            type="button"
            class="text-sm font-bold text-blue-500 hover:text-blue-600 transition-colors"
            @click="clearText"
          >
            清空内容
          </button>
        </div>
      </div>
      <input ref="fileInput" type="file" accept=".txt,text/plain" class="hidden" @change="onFileSelected" />

      <!-- Textarea -->
      <div class="bg-[#F8F9FA] rounded-2xl border-2 border-transparent focus-within:border-blue-100 p-4 h-[140px] shrink-0 mb-4">
        <textarea 
          v-model="textContent"
          class="w-full h-full bg-transparent resize-none outline-none text-[#1B254B] font-medium leading-relaxed placeholder-gray-400"
          placeholder="请输入评测文本..."
        ></textarea>
      </div>

      <!-- 智能分句结果 -->
      <div v-if="sentences.length" class="mb-4 flex flex-col gap-2 flex-1 min-h-0">
        <div class="flex items-center justify-between shrink-0">
          <span class="text-sm font-black text-gray-900">分句列表（{{ sentences.length }} 句）</span>
          <span class="text-xs font-bold text-[#70C125]">已完成 {{ results.filter((r) => r.status === 'done').length }} / {{ sentences.length }}</span>
        </div>
        <div class="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto pr-1">
          <button
            v-for="(sentence, index) in sentences"
            :key="index"
            type="button"
            class="w-full text-left px-4 py-3 rounded-2xl border-2 transition-all flex items-center gap-3 shrink-0"
            :class="index === activeIndex ? 'border-[#70C125] bg-[#F0F7E2]' : 'border-gray-100 bg-[#F8F9FA] hover:border-gray-200'"
            @click="selectSentence(index)"
          >
            <span class="shrink-0 w-6 h-6 rounded-lg bg-white border border-gray-200 text-gray-500 text-xs font-black flex items-center justify-center">{{ index + 1 }}</span>
            <span class="flex-1 text-sm font-medium text-[#1B254B] line-clamp-1">{{ sentence }}</span>
            <span v-if="results[index]?.score !== null && results[index]?.score !== undefined" class="shrink-0 text-xs font-black text-[#70C125]">{{ Math.round(results[index]!.score!) }}</span>
            <span class="shrink-0 text-[10px] font-bold px-2 py-1 rounded-full" :class="statusClass(results[index]?.status ?? 'pending')">{{ statusText(results[index]?.status ?? 'pending') }}</span>
          </button>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap items-center justify-between gap-4 mt-auto shrink-0">
        <div class="flex flex-wrap items-center gap-3">
          <button
            type="button"
            class="bg-[#70C125] text-white px-5 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-[#63ad20] border-b-4 border-[#5E9E1A] active:border-b-0 active:translate-y-1 transition-all shrink-0"
            @click="splitSentences"
          >
            <img src="../../assets/figma/icon-split.svg" class="w-5 h-5 invert brightness-0" alt="" />
            智能分句
          </button>
        </div>
      </div>
    </div>

    <!-- Bottom Box: Recording Area（紧凑操作条，固定高度不再撑满） -->
    <div class="relative bg-white rounded-[32px] border-2 border-gray-100 shadow-sm overflow-hidden flex flex-col items-center justify-center shrink-0 gap-3 py-4 px-6">
      <!-- Progress: 顶部细线 -->
      <div v-if="sentences.length" class="absolute top-0 left-0 w-full h-1 bg-gray-100">
        <div class="h-1 bg-[#70C125] transition-[width] duration-300" :style="{ width: `${progressPercent}%` }"></div>
      </div>

      <!-- 当前评测句 -->
      <div v-if="currentSentence" class="w-full flex items-center justify-center gap-2 min-w-0">
        <span class="text-xs font-black text-gray-400 uppercase tracking-wider shrink-0">当前评测句</span>
        <p class="text-sm font-bold text-[#1B254B] truncate">{{ currentSentence }}</p>
      </div>

      <!-- Waveform + Device Ready Pill -->
      <div class="flex items-center gap-4 shrink-0">
        <img src="../../assets/figma/hero-image.png" alt="Waveform" class="h-10 w-auto object-contain" />

        <div class="bg-[#F8F9FA] border border-gray-100 shadow-sm rounded-full px-4 py-1.5 flex items-center gap-2">
          <div class="w-2.5 h-2.5 rounded-full" :class="recording || analyzing ? 'bg-[#FF80B5]' : 'bg-[#70C125]'"></div>
          <span class="text-gray-900 font-bold text-xs">{{ recording || analyzing ? '正在评测' : '设备已就绪' }}</span>
        </div>
      </div>

      <!-- Recording Action Buttons -->
      <div class="flex items-center gap-4 w-full max-w-[420px]">
        <button
          type="button"
          class="flex-1 bg-[#70C125] text-white py-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 hover:bg-[#63ad20] border-b-4 border-[#5E9E1A] active:border-b-0 active:translate-y-1 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          :class="recording ? 'hidden' : ''"
          :disabled="!canRecord"
          @click="startRecording"
        >
          <img src="../../assets/figma/icon-start.svg" class="w-5 h-5 invert brightness-0" alt="" />
          <span class="font-black text-sm">{{ recordingLabel() }}</span>
        </button>
        
        <button
          type="button"
          class="flex-1 bg-[#FF80B5] text-white py-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 hover:bg-[#e673a3] border-b-4 border-[#D16A95] active:border-b-0 active:translate-y-1 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          :class="recording ? '' : 'hidden'"
          :disabled="!canStopRecording"
          @click="stopRecording"
        >
          <img src="../../assets/figma/icon-stop.svg" class="w-5 h-5 invert brightness-0" alt="" />
          <span class="font-black text-sm">结束录音</span>
        </button>
      </div>
    </div>
  </div>
</template>
