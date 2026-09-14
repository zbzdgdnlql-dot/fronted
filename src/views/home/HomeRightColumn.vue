<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Loader2, PlayCircle, Square } from 'lucide-vue-next'
import { useHomeEvaluation } from './useHomeEvaluation'
import ScoreRadarChart from '../../components/ScoreRadarChart.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import type { WordScoreItem } from '../../api/endpoints'
import { matchSentenceWords } from '../../utils/sentenceWords'
import { useToast } from '../../composables/useToast'

const {
  sentences,
  activeIndex,
  recording,
  currentSentence,
  currentResultScore,
  currentRecordedAudio,
  radarItems,
  currentWords,
  completedCount,
  averageScore,
  playingRecording,
  toggleRecordedAudio,
  stopAudio,
} = useHomeEvaluation()

const toast = useToast()

const toNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

/** 本句总分：后端评测失败时 total_score 为 null，应显示 -- 而不是 0.0 分 */
const totalScore = computed(() => {
  const raw = currentResultScore.value?.total_score as unknown
  if (raw === null || raw === undefined || raw === '') return null
  const parsed = typeof raw === 'number' ? raw : Number(raw)
  return Number.isFinite(parsed) ? parsed : null
})

const scoreColor = (value: number) => {
  if (value >= 80) return 'text-[#70C125]'
  if (value >= 60) return 'text-amber-500'
  return 'text-red-500'
}

/** 单词得分下划线：绿（优秀）/ 黄（及格）/ 红（待改进） */
const underlineColor = (value: number) => {
  if (value >= 80) return 'bg-[#70C125]'
  if (value >= 60) return 'bg-[#FFC107]'
  return 'bg-[#FF6B6B]'
}

const hasData = () => !!currentResultScore.value || completedCount.value > 0

// ---- 逐词渲染：后端词列表不含标点，按原句把标点补回词尾 ----
const wordDisplays = computed(() => {
  const words = currentWords.value
  const layout = matchSentenceWords(currentSentence.value, words.map((word) => word.word))
  return {
    prefix: layout.prefix,
    items: layout.words.map((matched) => ({
      index: matched.index,
      text: matched.value,
      suffix: matched.suffix,
      word: words[matched.index],
    })),
  }
})

// ---- 悬停单词浮层：fixed + Teleport 到 body，避免被容器 overflow 裁切（穿模） ----
const hoveredIndex = ref<number | null>(null)
const tooltipStyle = ref<Record<string, string>>({})
const hoveredWord = computed(() =>
  hoveredIndex.value === null ? null : currentWords.value[hoveredIndex.value] ?? null,
)
// 鼠标从单词移到浮层上时不该立刻收起，留一小段缓冲时间
let hideTooltipTimer: number | null = null

const cancelHideTooltip = () => {
  if (hideTooltipTimer !== null) {
    window.clearTimeout(hideTooltipTimer)
    hideTooltipTimer = null
  }
}

const scheduleHideTooltip = () => {
  cancelHideTooltip()
  hideTooltipTimer = window.setTimeout(() => {
    hoveredIndex.value = null
    hideTooltipTimer = null
  }, 180)
}

const showWordTooltip = (index: number, event: MouseEvent) => {
  const el = event.currentTarget as HTMLElement | null
  if (!el) return
  cancelHideTooltip()
  const rect = el.getBoundingClientRect()
  const width = 230
  const left = Math.min(Math.max(rect.left + rect.width / 2 - width / 2, 8), window.innerWidth - width - 8)
  const above = rect.top > 170
  hoveredIndex.value = index
  tooltipStyle.value = {
    left: `${left}px`,
    top: above ? `${rect.top - 10}px` : `${rect.bottom + 10}px`,
    width: `${width}px`,
    transform: above ? 'translateY(-100%)' : 'none',
  }
}

const hideWordTooltip = () => {
  cancelHideTooltip()
  hoveredIndex.value = null
}

// ---- 词级发音：没有独立接口，用本句原始录音按 start_ms / duration_ms 切片播放 ----
const wordAudioKey = ref('')
const wordAudioLoading = ref(false)
const wordAudioPlaying = ref(false)
let wordAudio: HTMLAudioElement | null = null
let wordAudioUrl: string | null = null
let wordAudioRafId = 0
// 递增令牌：切换单词或停止播放时作废旧回调
let wordAudioToken = 0

// 后端下发的 start_ms / duration_ms 实际是 Azure 的 Offset / Duration，
// 单位为 ticks（100 纳秒）：1 毫秒 = 10,000 ticks，1 秒 = 10,000,000 ticks。
// HTMLMediaElement.currentTime 的单位是秒，故按「ticks/秒」换算。
const TICKS_PER_SECOND = 10_000_000

// 主页没有评测 id，用「句子下标 + 词下标」唯一标识当前试听的词
const wordAudioId = (index: number) => `${activeIndex.value}:${index}`
const isWordAudioActive = (index: number) =>
  wordAudioKey.value === wordAudioId(index) && (wordAudioLoading.value || wordAudioPlaying.value)
const hoveredWordAudioActive = computed(() =>
  hoveredIndex.value === null ? false : isWordAudioActive(hoveredIndex.value),
)

const releaseWordAudio = () => {
  wordAudioToken += 1
  if (wordAudioRafId) {
    window.cancelAnimationFrame(wordAudioRafId)
    wordAudioRafId = 0
  }
  if (wordAudio) {
    wordAudio.onloadedmetadata = null
    wordAudio.onended = null
    wordAudio.onerror = null
    wordAudio.pause()
    wordAudio = null
  }
  if (wordAudioUrl) {
    URL.revokeObjectURL(wordAudioUrl)
    wordAudioUrl = null
  }
  wordAudioKey.value = ''
  wordAudioLoading.value = false
  wordAudioPlaying.value = false
}

// 再次点击同一单词停止，否则从该词的 start_ms 播放 duration_ms 时长
const playWordAudio = async (index: number) => {
  if (isWordAudioActive(index)) {
    releaseWordAudio()
    return
  }
  const word: WordScoreItem | undefined = currentWords.value[index]
  if (!word) return
  const blob = currentRecordedAudio.value
  if (!blob) {
    toast.push('本句暂无录音，无法试听单词发音', 'warning')
    return
  }
  const startMs = typeof word.start_ms === 'number' ? word.start_ms : NaN
  const durationMs = typeof word.duration_ms === 'number' ? word.duration_ms : NaN
  if (!Number.isFinite(startMs) || startMs < 0 || !Number.isFinite(durationMs) || durationMs <= 0) {
    toast.push(`「${word.word}」暂无发音区间信息`, 'warning')
    return
  }
  // 与整句朗读/回放互斥
  stopAudio()
  const token = ++wordAudioToken
  wordAudioKey.value = wordAudioId(index)
  wordAudioLoading.value = true
  try {
    const url = URL.createObjectURL(blob)
    wordAudioUrl = url
    const audio = new Audio(url)
    audio.preload = 'auto'
    wordAudio = audio
    await new Promise<void>((resolve, reject) => {
      audio.onloadedmetadata = () => resolve()
      audio.onerror = () => reject(new Error('音频加载失败'))
      if (audio.readyState >= 1) resolve()
    })
    if (token !== wordAudioToken) return
    audio.currentTime = startMs / TICKS_PER_SECOND
    wordAudioLoading.value = false
    wordAudioPlaying.value = true
    const endSeconds = (startMs + durationMs) / TICKS_PER_SECOND
    // 按音频时钟判停，比 timeupdate（约 250ms 粒度）精确
    const watchProgress = () => {
      if (token !== wordAudioToken) return
      if (audio.currentTime >= endSeconds) {
        releaseWordAudio()
        return
      }
      wordAudioRafId = window.requestAnimationFrame(watchProgress)
    }
    wordAudioRafId = window.requestAnimationFrame(watchProgress)
    audio.onended = () => {
      if (token === wordAudioToken) releaseWordAudio()
    }
    audio.onerror = () => {
      if (token !== wordAudioToken) return
      toast.push('音频播放失败', 'error')
      releaseWordAudio()
    }
    await audio.play()
  } catch (error) {
    if (token !== wordAudioToken) return
    releaseWordAudio()
    toast.push(error instanceof Error ? error.message : '音频获取失败，请稍后重试', 'error')
  }
}

// 切句后旧的单词切片播放没有意义，直接停止并收起浮层
watch(currentSentence, () => {
  hideWordTooltip()
  releaseWordAudio()
})

// 浮层里的播放按钮：作用于当前悬停的词
const toggleHoveredWordAudio = () => {
  if (hoveredIndex.value === null) return
  void playWordAudio(hoveredIndex.value)
}

// 滚动（含容器内滚动）时锚点会漂移，直接收起浮层
const onAnyScroll = () => hideWordTooltip()

// ---- 未评测提示中的整句：过长时默认两行省略，点击「展开」换行显示 ----
const rightSentenceEl = ref<HTMLElement | null>(null)
const rightSentenceExpanded = ref(false)
const rightSentenceOverflow = ref(false)

const measureRightSentence = () => {
  const el = rightSentenceEl.value
  if (!el) {
    rightSentenceOverflow.value = false
    return
  }
  // 已展开的句子保留展开键，便于收起
  if (rightSentenceExpanded.value) {
    rightSentenceOverflow.value = true
    return
  }
  rightSentenceOverflow.value = el.scrollHeight - el.clientHeight > 1
}

watch(
  currentSentence,
  () => {
    rightSentenceExpanded.value = false
    void nextTick(measureRightSentence)
  },
  { flush: 'post' },
)

watch(rightSentenceExpanded, () => void nextTick(measureRightSentence), { flush: 'post' })

onMounted(() => {
  window.addEventListener('scroll', onAnyScroll, true)
  window.addEventListener('resize', measureRightSentence)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onAnyScroll, true)
  window.removeEventListener('resize', measureRightSentence)
  releaseWordAudio()
})

</script>

<template>
  <div class="flex flex-col h-full min-h-0">
    <!-- Top Box: Comprehensive Report -->
    <div class="bg-white rounded-[32px] p-6 border-2 border-gray-100 shadow-sm flex flex-col mb-6 shrink-0">
      <h3 class="text-lg font-black text-gray-900 mb-4">综合评测报告</h3>

      <template v-if="hasData()">
        <div class="flex gap-3">
          <!-- 两个分数：纵向紧凑排列 -->
          <div class="flex w-[38%] shrink-0 flex-col gap-2">
            <div class="flex flex-1 flex-col justify-center rounded-2xl bg-[#F8F9FA] border border-gray-100 px-3 py-2">
              <div class="text-[11px] font-black text-gray-400">平均分</div>
              <div class="text-2xl font-black leading-tight text-gray-900">{{ averageScore === null ? '--' : averageScore.toFixed(1) }}</div>
            </div>
            <div class="flex flex-1 flex-col justify-center rounded-2xl bg-[#F8F9FA] border border-gray-100 px-3 py-2">
              <div class="text-[11px] font-black text-gray-400">本句总分</div>
              <div class="text-2xl font-black leading-tight text-[#70C125]">{{ totalScore === null ? '--' : totalScore.toFixed(1) }}</div>
            </div>
          </div>

          <!-- 雷达图：与分数同排，压缩高度 -->
          <div class="min-w-0 flex-1 rounded-2xl bg-[#F8F9FA] border border-gray-100 px-2 py-2">
            <div class="ml-2 text-[11px] font-black text-gray-400">本句三维雷达图</div>
            <ScoreRadarChart v-if="radarItems.length" :items="radarItems" height="128px" />
            <div v-else class="flex items-center justify-center text-xs font-bold text-gray-400" style="height: 128px">本句暂无三维评分</div>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="flex flex-col gap-4">
          <div class="text-sm font-bold text-gray-500">
            暂无评测数据。请在左侧输入文本、点击「智能分句」，再开始录音后查看即时结果。
          </div>
          <div class="flex gap-3">
            <div class="flex w-[38%] shrink-0 flex-col gap-2">
              <SkeletonBlock class="h-[74px] w-full" />
              <SkeletonBlock class="h-[74px] w-full" />
            </div>
            <SkeletonBlock class="h-[162px] flex-1" />
          </div>
        </div>
      </template>
    </div>

    <!-- Bottom Box: Sentence Analysis -->
    <div class="bg-white rounded-[32px] p-6 border-2 border-gray-100 shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
      <div class="flex items-center justify-between gap-3 mb-4 shrink-0">
        <h3 class="text-lg font-black text-gray-900">单句评分分析</h3>
        <div class="flex items-center gap-2">
          <button
            v-if="currentSentence && currentRecordedAudio"
            type="button"
            class="flex items-center gap-1.5 rounded-full border border-[#70C125]/30 bg-[#F0F7E2] px-3 py-1.5 text-xs font-black text-[#70C125] hover:bg-[#E4F0D0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            :disabled="recording"
            @click="toggleRecordedAudio"
          >
            <Square v-if="playingRecording" class="h-3.5 w-3.5" />
            <PlayCircle v-else class="h-3.5 w-3.5" />
            {{ playingRecording ? '停止' : '听我的录音' }}
          </button>
          <div class="bg-gray-100 px-4 py-1.5 rounded-full">
            <span class="text-gray-500 font-black text-xs uppercase tracking-wider">{{ currentSentence ? `第 ${activeIndex + 1} 句` : `共 ${sentences.length} 句` }}</span>
          </div>
        </div>
      </div>

      <template v-if="currentSentence">
        <div v-if="currentResultScore" class="bg-gray-50 border border-gray-100 rounded-3xl p-4 flex flex-col gap-3 flex-1 min-h-0">
          <div class="flex items-center justify-between shrink-0">
            <span class="text-xs font-black text-gray-400">逐词评分（悬停单词查看音素详情）</span>
            <span class="text-sm font-black" :class="totalScore === null ? 'text-orange-500' : 'text-[#70C125]'">{{ totalScore === null ? '--' : totalScore.toFixed(1) }} 分</span>
          </div>

          <div v-if="totalScore === null" class="flex-1 rounded-2xl bg-orange-50 border border-orange-100 p-5 text-sm font-bold text-orange-600 flex items-center justify-center">
            评测未返回有效分数，请重新录音后再试
          </div>
          <div v-else-if="!currentWords.length" class="flex-1 rounded-2xl bg-white border border-gray-100 p-5 text-sm font-bold text-gray-400 flex items-center justify-center">
            暂无单词级明细
          </div>
          <div v-else class="flex flex-1 min-h-0 flex-col">
            <!-- 逐词下划线：绿 / 黄 / 红 表示得分档位 -->
            <div class="flex-1 min-h-0 overflow-y-auto rounded-2xl bg-white border border-gray-100 p-4">
              <div class="flex flex-wrap items-end gap-x-3 gap-y-3">
                <span v-if="wordDisplays.prefix" class="pb-2.5 text-lg font-black leading-tight text-[#1B254B]">{{ wordDisplays.prefix }}</span>
                <span
                  v-for="item in wordDisplays.items"
                  :key="`${item.index}-${item.text}`"
                  class="inline-flex cursor-help flex-col items-stretch transition-transform hover:-translate-y-0.5"
                  @mouseenter="showWordTooltip(item.index, $event)"
                  @mouseleave="scheduleHideTooltip"
                >
                  <span class="px-0.5 text-lg font-black leading-tight text-[#1B254B]">{{ item.text }}{{ item.suffix }}</span>
                  <span class="mt-1 h-1.5 w-full rounded-full" :class="underlineColor(toNumber(item.word.pronunciation))"></span>
                </span>
              </div>
            </div>

            <!-- 图例 -->
            <div class="mt-3 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-bold text-gray-400">
              <span class="flex items-center gap-1.5"><span class="h-1.5 w-4 rounded-full bg-[#70C125]"></span>优秀 ≥ 80</span>
              <span class="flex items-center gap-1.5"><span class="h-1.5 w-4 rounded-full bg-[#FFC107]"></span>及格 60 - 79</span>
              <span class="flex items-center gap-1.5"><span class="h-1.5 w-4 rounded-full bg-[#FF6B6B]"></span>待改进 &lt; 60</span>
            </div>
          </div>
        </div>

        <div v-else class="bg-gray-50 border border-gray-100 rounded-3xl p-6 flex flex-col items-center justify-center gap-2">
          <p
            ref="rightSentenceEl"
            class="w-full text-sm font-black text-center leading-relaxed text-[#1B254B] whitespace-normal break-words"
            :class="rightSentenceExpanded ? '' : 'line-clamp-2'"
          >{{ currentSentence }}</p>
          <button
            v-if="rightSentenceOverflow"
            type="button"
            class="rounded-full bg-[#F0F7E2] px-2.5 py-0.5 text-[11px] font-black text-[#70C125] hover:bg-[#E4F0D0] transition-colors"
            @click="rightSentenceExpanded = !rightSentenceExpanded"
          >
            {{ rightSentenceExpanded ? '收起' : '展开' }}
          </button>
          <div class="text-sm font-bold text-gray-500 text-center">录制本句后，这里会用红黄绿下划线标注每个单词的得分。</div>
        </div>
      </template>

      <template v-else>
        <div class="bg-gray-50 border border-gray-100 rounded-3xl p-6 flex flex-col gap-4 min-h-0 overflow-y-auto">
          <div class="text-sm font-bold text-gray-500">完成一次评测后将展示单句得分与音素薄弱点。</div>
          <SkeletonBlock class="h-14 w-full shrink-0" />
          <SkeletonBlock class="h-14 w-full shrink-0" />
          <SkeletonBlock class="h-14 w-full shrink-0" />
        </div>
      </template>
    </div>

    <!-- 单词得分浮层：fixed 定位并挂到 body，避免被容器裁切 -->
    <Teleport to="body">
      <div
        v-if="hoveredWord"
        class="fixed z-[60] rounded-xl border border-[#E8ECF2] bg-white/95 px-3 py-2.5 text-[#1F2937] shadow-[0_12px_32px_rgba(15,23,42,0.14)] backdrop-blur-sm"
        :style="tooltipStyle"
        @mouseenter="cancelHideTooltip"
        @mouseleave="scheduleHideTooltip"
      >
        <div class="flex items-center gap-1.5">
          <span class="truncate text-sm font-black tracking-tight">{{ hoveredWord.word }}</span>
          <span
            v-if="hoveredWord.error_type && hoveredWord.error_type !== 'None'"
            class="shrink-0 rounded-full bg-orange-50 px-1.5 py-0.5 text-[10px] font-black text-orange-600"
          >
            {{ hoveredWord.error_type }}
          </span>
          <!-- 播放该单词的用户发音：本句原始录音按 start_ms/duration_ms 切片 -->
          <button
            type="button"
            class="ml-auto flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors disabled:cursor-wait"
            :class="
              hoveredWordAudioActive
                ? 'bg-[#70C125] text-white'
                : 'bg-[#F0F7E2] text-[#356B00] hover:bg-[#E4F0D0]'
            "
            :title="hoveredWordAudioActive ? '停止播放' : '播放我的该词发音'"
            :disabled="wordAudioLoading && hoveredWordAudioActive"
            @click="toggleHoveredWordAudio()"
          >
            <Loader2 v-if="wordAudioLoading && hoveredWordAudioActive" class="h-3.5 w-3.5 animate-spin" />
            <Square v-else-if="hoveredWordAudioActive" class="h-3.5 w-3.5" />
            <PlayCircle v-else class="h-3.5 w-3.5" />
          </button>
        </div>
        <div class="mt-1.5 flex items-center gap-1.5">
          <span class="text-[11px] font-bold text-[#9CA3AF]">单词得分</span>
          <span class="text-sm font-black tabular-nums" :class="scoreColor(toNumber(hoveredWord.pronunciation))">{{ toNumber(hoveredWord.pronunciation).toFixed(1) }}</span>
        </div>
        <div v-if="hoveredWord.phonemes?.length" class="mt-2 border-t border-[#F1F5F9] pt-2">
          <div class="mb-1.5 text-[10px] font-black tracking-wider text-[#9CA3AF]">音素得分</div>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="phoneme in hoveredWord.phonemes"
              :key="`${phoneme.phoneme}-${phoneme.pronunciation}`"
              class="rounded-md border border-[#EEF2F7] bg-[#F8FAFC] px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-[#64748B]"
            >
              {{ phoneme.phoneme }}
              <span class="font-black" :class="scoreColor(toNumber(phoneme.pronunciation))">{{ toNumber(phoneme.pronunciation).toFixed(0) }}</span>
            </span>
          </div>
        </div>
        <div v-else class="mt-2 border-t border-[#F1F5F9] pt-2 text-[10px] font-bold text-[#9CA3AF]">暂无音素级明细</div>
      </div>
    </Teleport>
  </div>
</template>
