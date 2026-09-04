<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useHomeEvaluation } from './useHomeEvaluation'
import { useToast } from '../../composables/useToast'
import { synthesizeText } from '../../api/endpoints'

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
  loadStudentLanguage,
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

const speeds = ['0.5x', '0.75x', '1.0x', '1.25x', '1.5x', '2.0x']
const selectedSpeed = ref('1.0x')
const showSpeedDropdown = ref(false)

const toggleDropdown = () => {
  showSpeedDropdown.value = !showSpeedDropdown.value
}

const selectSpeed = (speed: string) => {
  selectedSpeed.value = speed
  showSpeedDropdown.value = false
}

// ---- TTS 朗读全文 ----
const playing = ref(false)
let currentAudio: HTMLAudioElement | null = null
let currentAudioUrl: string | null = null

const speedToRate = (speed: string) => {
  const multiplier = parseFloat(String(speed).replace('x', ''))
  if (Number.isNaN(multiplier)) return '+0%'
  const pct = Math.round((multiplier - 1) * 100)
  return pct >= 0 ? `+${pct}%` : `${pct}%`
}

const stopAudio = () => {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl)
    currentAudioUrl = null
  }
  playing.value = false
}

const readAloud = async () => {
  const raw = textContent.value.trim()
  if (!raw) {
    toast.push('请先输入评测文本', 'warning')
    return
  }
  stopAudio()
  try {
    const lang = await loadStudentLanguage()
    const blob = await synthesizeText({
      text: raw,
      lang,
      rate: speedToRate(selectedSpeed.value),
    })
    currentAudioUrl = URL.createObjectURL(blob)
    const audio = new Audio(currentAudioUrl)
    currentAudio = audio
    playing.value = true
    audio.onended = () => {
      playing.value = false
    }
    audio.onerror = () => {
      playing.value = false
      toast.push('语音播放失败', 'error')
    }
    await audio.play()
  } catch (err: any) {
    stopAudio()
    toast.push(typeof err?.message === 'string' && err.message ? err.message : '语音合成失败，请稍后重试', 'error')
  }
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

// Close dropdown when clicking outside
const closeDropdown = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.speed-dropdown-container')) {
    showSpeedDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
  stopAudio()
  cleanup()
})
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Top Box: Textarea Area -->
    <div class="bg-white rounded-[32px] p-8 border-2 border-gray-100 shadow-sm flex flex-col flex-1 min-h-[500px]">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
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
      <div class="bg-[#F8F9FA] rounded-2xl border-2 border-transparent focus-within:border-blue-100 p-4 flex-1 mb-4">
        <textarea 
          v-model="textContent"
          class="w-full h-full bg-transparent resize-none outline-none text-[#1B254B] font-medium leading-relaxed placeholder-gray-400"
          placeholder="请输入评测文本..."
        ></textarea>
      </div>

      <!-- 智能分句结果 -->
      <div v-if="sentences.length" class="mb-4 flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
        <div class="flex items-center justify-between">
          <span class="text-sm font-black text-gray-900">分句列表（{{ sentences.length }} 句）</span>
          <span class="text-xs font-bold text-[#70C125]">已完成 {{ results.filter((r) => r.status === 'done').length }} / {{ sentences.length }}</span>
        </div>
        <button
          v-for="(sentence, index) in sentences"
          :key="index"
          type="button"
          class="w-full text-left px-4 py-3 rounded-2xl border-2 transition-all flex items-center gap-3"
          :class="index === activeIndex ? 'border-[#70C125] bg-[#F0F7E2]' : 'border-gray-100 bg-[#F8F9FA] hover:border-gray-200'"
          @click="selectSentence(index)"
        >
          <span class="shrink-0 w-6 h-6 rounded-lg bg-white border border-gray-200 text-gray-500 text-xs font-black flex items-center justify-center">{{ index + 1 }}</span>
          <span class="flex-1 text-sm font-medium text-[#1B254B] line-clamp-1">{{ sentence }}</span>
          <span v-if="results[index]?.score !== null && results[index]?.score !== undefined" class="shrink-0 text-xs font-black text-[#70C125]">{{ Math.round(results[index]!.score!) }}</span>
          <span class="shrink-0 text-[10px] font-bold px-2 py-1 rounded-full" :class="statusClass(results[index]?.status ?? 'pending')">{{ statusText(results[index]?.status ?? 'pending') }}</span>
        </button>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap items-center justify-between gap-4 mt-auto">
        <div class="flex flex-wrap items-center gap-3">
          <button
            type="button"
            class="bg-[#70C125] text-white px-5 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-[#63ad20] border-b-4 border-[#5E9E1A] active:border-b-0 active:translate-y-1 transition-all shrink-0"
            @click="splitSentences"
          >
            <img src="../../assets/figma/icon-split.svg" class="w-5 h-5 invert brightness-0" alt="" />
            智能分句
          </button>
          
          <button
            type="button"
            class="bg-[#FFC107] text-white px-5 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-[#e6ad06] border-b-4 border-[#D9A406] active:border-b-0 active:translate-y-1 transition-all shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
            :disabled="!sentences.length || !textContent.trim()"
            @click="playing ? stopAudio() : readAloud()"
          >
            <img src="../../assets/figma/icon-play.svg" class="w-5 h-5 invert brightness-0" alt="" />
            {{ playing ? '停止朗读' : '朗读全文' }}
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <!-- Speed Control Dropdown -->
          <div class="relative speed-dropdown-container">
            <div 
              @click="toggleDropdown"
              class="border-2 border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors bg-white"
            >
              <span class="text-blue-500 font-extrabold text-sm w-8 text-center">{{ selectedSpeed }}</span>
              <img src="../../assets/figma/icon-audio.svg" class="w-5 h-5 transition-transform duration-200" :class="showSpeedDropdown ? 'rotate-180' : ''" alt="" />
            </div>

            <!-- Dropdown Menu -->
            <Transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="transform scale-95 opacity-0"
              enter-to-class="transform scale-100 opacity-100"
              leave-active-class="transition duration-75 ease-in"
              leave-from-class="transform scale-100 opacity-100"
              leave-to-class="transform scale-95 opacity-0"
            >
              <div 
                v-if="showSpeedDropdown"
                class="absolute bottom-full mb-2 right-0 bg-white border border-gray-100 rounded-xl shadow-lg py-2 w-32 z-20"
              >
                <div 
                  v-for="speed in speeds" 
                  :key="speed"
                  @click="selectSpeed(speed)"
                  class="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center justify-between"
                  :class="selectedSpeed === speed ? 'bg-blue-50/50' : ''"
                >
                  <span class="text-sm font-bold" :class="selectedSpeed === speed ? 'text-blue-500' : 'text-gray-700'">
                    {{ speed }}
                  </span>
                  <div v-if="selectedSpeed === speed" class="w-2 h-2 rounded-full bg-blue-500"></div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Box: Recording Area -->
    <div class="bg-white rounded-[32px] border-2 border-gray-100 shadow-sm overflow-hidden min-h-[340px] flex flex-col items-center justify-center mt-6 shrink-0 gap-5 py-8 px-6">
      <!-- 当前评测句 -->
      <div v-if="currentSentence" class="w-full text-center shrink-0">
        <span class="text-xs font-black text-gray-400 uppercase tracking-wider">当前评测句</span>
        <p class="mt-1 text-sm font-bold text-[#1B254B] truncate">{{ currentSentence }}</p>
      </div>

      <!-- Waveform Image -->
      <img src="../../assets/figma/hero-image.png" alt="Waveform" class="h-12 w-auto object-contain shrink-0" />

      <!-- Device Ready Pill -->
      <div class="bg-[#F8F9FA] border border-gray-100 shadow-sm rounded-full px-5 py-2.5 flex items-center gap-3">
        <div class="w-3 h-3 rounded-full" :class="recording || analyzing ? 'bg-[#FF80B5]' : 'bg-[#70C125]'"></div>
        <span class="text-gray-900 font-bold text-sm">{{ recording || analyzing ? '正在评测' : '设备已就绪' }}</span>
      </div>

      <!-- Recording Action Buttons -->
      <div class="flex items-center gap-6 w-full max-w-[480px] px-6">
        <button
          type="button"
          class="flex-1 bg-[#70C125] text-white py-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-[#63ad20] border-b-[6px] border-[#5E9E1A] active:border-b-0 active:translate-y-1.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          :class="recording ? 'hidden' : ''"
          :disabled="!canRecord"
          @click="startRecording"
        >
          <img src="../../assets/figma/icon-start.svg" class="w-6 h-6 invert brightness-0" alt="" />
          <span class="font-black text-sm">{{ recordingLabel() }}</span>
        </button>
        
        <button
          type="button"
          class="flex-1 bg-[#FF80B5] text-white py-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-[#e673a3] border-b-[6px] border-[#D16A95] active:border-b-0 active:translate-y-1.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          :class="recording ? '' : 'hidden'"
          :disabled="!canStopRecording"
          @click="stopRecording"
        >
          <img src="../../assets/figma/icon-stop.svg" class="w-6 h-6 invert brightness-0" alt="" />
          <span class="font-black text-sm">结束录音</span>
        </button>
      </div>

      <!-- Progress -->
      <div v-if="sentences.length" class="w-full max-w-[360px] px-6">
        <div class="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div class="h-2 bg-[#70C125] rounded-full transition-[width] duration-300" :style="{ width: `${progressPercent}%` }"></div>
        </div>
      </div>
    </div>
  </div>
</template>
