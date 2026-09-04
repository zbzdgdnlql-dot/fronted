<script setup lang="ts">
import { useHomeEvaluation } from './useHomeEvaluation'
import ScoreRadarChart from '../../components/ScoreRadarChart.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'

const {
  sentences,
  activeIndex,
  currentSentence,
  currentResultScore,
  radarItems,
  currentWords,
  completedCount,
  averageScore,
  progressPercent,
} = useHomeEvaluation()

const toNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const scoreColor = (value: number) => {
  if (value >= 80) return 'text-[#70C125]'
  if (value >= 60) return 'text-amber-500'
  return 'text-red-500'
}

const hasData = () => !!currentResultScore.value || completedCount.value > 0
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Top Box: Comprehensive Report -->
    <div class="bg-white rounded-[32px] p-8 border-2 border-gray-100 shadow-sm flex flex-col mb-8 min-h-[340px] shrink-0">
      <h3 class="text-lg font-black text-gray-900 mb-6">综合评测报告</h3>

      <template v-if="hasData()">
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="rounded-2xl bg-[#F8F9FA] border border-gray-100 p-5">
            <div class="text-xs font-black text-gray-400 mb-1">平均分</div>
            <div class="text-2xl font-black text-gray-900">{{ averageScore === null ? '--' : averageScore.toFixed(1) }}</div>
          </div>
          <div class="rounded-2xl bg-[#F8F9FA] border border-gray-100 p-5">
            <div class="text-xs font-black text-gray-400 mb-1">本句总分</div>
            <div class="text-2xl font-black text-[#70C125]">{{ currentResultScore ? toNumber(currentResultScore.total_score).toFixed(1) : '--' }}</div>
          </div>
          <div class="rounded-2xl bg-[#F8F9FA] border border-gray-100 p-5">
            <div class="text-xs font-black text-gray-400 mb-1">完成进度</div>
            <div class="text-2xl font-black text-gray-900">{{ progressPercent }}%</div>
          </div>
          <div class="rounded-2xl bg-[#F8F9FA] border border-gray-100 p-5">
            <div class="text-xs font-black text-gray-400 mb-1">已评测</div>
            <div class="text-2xl font-black text-gray-900">{{ completedCount }} / {{ sentences.length }} 句</div>
          </div>
        </div>

        <div v-if="radarItems.length" class="rounded-2xl bg-[#F8F9FA] border border-gray-100 p-4">
          <div class="text-xs font-black text-gray-400 mb-2">本句三维雷达图</div>
          <ScoreRadarChart :items="radarItems" :height="'220px'" />
        </div>

        <!-- 语速 -->
        <div class="bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 flex items-center justify-between mt-4">
          <span class="text-gray-500 font-black uppercase tracking-wider text-sm">语速</span>
          <span class="text-xl font-black text-gray-900">--</span>
        </div>
      </template>

      <template v-else>
        <div class="flex flex-col gap-4">
          <div class="text-sm font-bold text-gray-500">
            暂无评测数据。请在左侧输入文本、点击「智能分句」，再开始录音后查看即时结果。
          </div>
          <div class="grid grid-cols-2 gap-4">
            <SkeletonBlock class="h-20 w-full" />
            <SkeletonBlock class="h-20 w-full" />
            <SkeletonBlock class="h-20 w-full" />
            <SkeletonBlock class="h-20 w-full" />
          </div>
        </div>
      </template>
    </div>

    <!-- Bottom Box: Sentence Analysis -->
    <div class="bg-white rounded-[32px] p-8 border-2 border-gray-100 shadow-sm flex flex-col flex-1 min-h-[400px]">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-black text-gray-900">单句评分分析</h3>
        <div class="bg-gray-100 px-4 py-1.5 rounded-full">
          <span class="text-gray-500 font-black text-xs uppercase tracking-wider">{{ currentSentence ? `第 ${activeIndex + 1} 句` : `共 ${sentences.length} 句` }}</span>
        </div>
      </div>

      <template v-if="currentSentence">
        <p class="rounded-3xl bg-[#F8F9FA] border border-gray-100 p-5 text-base font-black leading-relaxed text-gray-900 mb-4">
          {{ currentSentence }}
        </p>

        <div v-if="currentResultScore" class="bg-gray-50 border border-gray-100 rounded-3xl p-6 flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black text-gray-400">单词/音素评分（{{ currentWords.length }} 个）</span>
            <span class="text-sm font-black text-[#70C125]">{{ toNumber(currentResultScore.total_score).toFixed(1) }} 分</span>
          </div>

          <div v-if="!currentWords.length" class="flex-1 rounded-2xl bg-white border border-gray-100 p-5 text-sm font-bold text-gray-400 flex items-center justify-center">
            暂无单词级明细
          </div>
          <div v-else class="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
            <div
              v-for="word in currentWords"
              :key="`${word.word}-${word.pronunciation}`"
              class="rounded-2xl bg-white border border-gray-100 p-4 flex flex-col gap-2"
            >
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="text-base font-black text-gray-900 truncate">{{ word.word }}</span>
                  <span v-if="word.error_type && word.error_type !== 'None'" class="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-black text-orange-600">
                    {{ word.error_type }}
                  </span>
                </div>
                <span class="text-sm font-black" :class="scoreColor(toNumber(word.pronunciation))">
                  {{ toNumber(word.pronunciation).toFixed(1) }} 分
                </span>
              </div>
              <div v-if="word.phonemes?.length" class="flex flex-wrap gap-2">
                <span
                  v-for="phoneme in word.phonemes"
                  :key="`${phoneme.phoneme}-${phoneme.pronunciation}`"
                  class="rounded-lg bg-[#F3F6F8] border border-gray-100 px-2 py-1 text-xs font-bold text-gray-600"
                >
                  {{ phoneme.phoneme }}
                  <span :class="scoreColor(toNumber(phoneme.pronunciation))">{{ toNumber(phoneme.pronunciation).toFixed(1) }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="bg-gray-50 border border-gray-100 rounded-3xl p-6 flex items-center justify-center">
          <div class="text-sm font-bold text-gray-500">选中上方句子并录音，完成后即时展示本句得分与音素薄弱点。</div>
        </div>
      </template>

      <template v-else>
        <div class="bg-gray-50 border border-gray-100 rounded-3xl p-6 flex flex-col gap-4">
          <div class="text-sm font-bold text-gray-500">完成一次评测后将展示单句得分与音素薄弱点。</div>
          <SkeletonBlock class="h-14 w-full" />
          <SkeletonBlock class="h-14 w-full" />
          <SkeletonBlock class="h-14 w-full" />
        </div>
      </template>
    </div>
  </div>
</template>
