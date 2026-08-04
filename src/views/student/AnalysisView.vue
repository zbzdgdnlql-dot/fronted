<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ChevronLeft, TrendingUp, TrendingDown, Volume2, BookOpen, Search } from 'lucide-vue-next'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import ErrorState from '../../components/ErrorState.vue'
import EmptyState from '../../components/EmptyState.vue'
import { useAsync } from '../../composables/useAsync'
import {
  getStudentHistoryWords,
  getStudentHistoryPhonemes,
  getStudentHistoryRanking,
  getStudentHistoryWordDetail,
  getStudentHistoryPhonemeDetail,
  type HistoryRanking,
} from '../../api/endpoints'
import router from '../../router'

const searchWord = ref('')
const selectedWord = ref<string | null>(null)
const selectedPhoneme = ref<string | null>(null)
const activeTab = ref<'words' | 'phonemes'>('words')

const wordsReq = useAsync<string[]>()
const phonemesReq = useAsync<string[]>()
const rankingReq = useAsync<HistoryRanking | null>()
const wordDetailReq = useAsync<Awaited<ReturnType<typeof getStudentHistoryWordDetail>> | null>()
const phonemeDetailReq = useAsync<Awaited<ReturnType<typeof getStudentHistoryPhonemeDetail>> | null>()

const loading = computed(() => wordsReq.loading.value || phonemesReq.loading.value || rankingReq.loading.value)
const error = computed(() => wordsReq.error.value || phonemesReq.error.value || rankingReq.error.value)

const words = computed(() => wordsReq.data.value ?? [])
const phonemes = computed(() => phonemesReq.data.value ?? [])
const ranking = computed<HistoryRanking | null>(() => rankingReq.data.value)

const filteredWords = computed(() => {
  if (!searchWord.value.trim()) return words.value
  return words.value.filter(w => w.toLowerCase().includes(searchWord.value.toLowerCase()))
})

const filteredPhonemes = computed(() => {
  if (!searchWord.value.trim()) return phonemes.value
  return phonemes.value.filter(p => p.toLowerCase().includes(searchWord.value.toLowerCase()))
})

const wordDetailData = computed(() => wordDetailReq.data.value)
const phonemeDetailData = computed(() => phonemeDetailReq.data.value)

const load = async () => {
  await Promise.all([
    wordsReq.run(() => getStudentHistoryWords()),
    phonemesReq.run(() => getStudentHistoryPhonemes()),
    rankingReq.run(() => getStudentHistoryRanking()),
  ])
}

const viewWordDetail = async (word: string) => {
  selectedWord.value = word
  selectedPhoneme.value = null
  await wordDetailReq.run(() => getStudentHistoryWordDetail(word))
}

const viewPhonemeDetail = async (phoneme: string) => {
  selectedPhoneme.value = phoneme
  selectedWord.value = null
  await phonemeDetailReq.run(() => getStudentHistoryPhonemeDetail(phoneme))
}

const closeDetail = () => {
  selectedWord.value = null
  selectedPhoneme.value = null
  wordDetailReq.data.value = null
  phonemeDetailReq.data.value = null
}

const scoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-red-500'
}

const barColor = (score: number) => {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
}

onMounted(() => {
  void load()
})
</script>

<template>
  <main class="flex-1 w-full max-w-[1440px] mx-auto p-8 flex flex-col gap-8">
    <div class="flex items-center justify-between gap-6">
      <nav class="flex items-center gap-2 text-sm font-bold text-gray-400">
        <span>学习分析</span>
      </nav>
      <button
        type="button"
        class="inline-flex items-center gap-2 text-sm font-black text-gray-500 hover:text-gray-700"
        @click="router.push('/')"
      >
        <ChevronLeft class="w-4 h-4" />
        返回主页
      </button>
    </div>

    <ErrorState
      v-if="error && !loading"
      title="加载失败"
      message="无法获取学习分析数据，请稍后重试。"
      :busy="loading"
      @retry="load"
    />

    <template v-if="loading && !words.length && !phonemes.length">
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SkeletonBlock class="h-60 w-full" />
        <SkeletonBlock class="h-60 w-full" />
      </div>
      <SkeletonBlock class="h-80 w-full" />
    </template>

    <template v-else-if="!words.length && !phonemes.length">
      <EmptyState
        title="暂无学习分析数据"
        description="完成评测后，你的学习数据将在这里展示。"
      />
    </template>

    <template v-else>
      <!-- Strength & Weakness Cards -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <!-- Strongest Words -->
        <section class="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center">
              <TrendingUp class="w-5 h-5 text-green-600" />
            </div>
            <h3 class="text-lg font-black text-gray-900">最强单词</h3>
          </div>
          <div v-if="ranking?.best_words?.length" class="flex flex-wrap gap-2">
            <button
              v-for="w in ranking.best_words"
              :key="w.word"
              class="rounded-2xl bg-green-50 border border-green-200 px-4 py-2 text-sm font-black text-green-700 hover:bg-green-100 transition-colors"
              @click="viewWordDetail(w.word)"
            >
              {{ w.word }} <span class="text-green-500">({{ w.score }})</span>
            </button>
          </div>
          <div v-else class="text-sm font-bold text-gray-400">暂无数据</div>
        </section>

        <!-- Weakest Words -->
        <section class="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
              <TrendingDown class="w-5 h-5 text-red-500" />
            </div>
            <h3 class="text-lg font-black text-gray-900">最弱单词</h3>
          </div>
          <div v-if="ranking?.worst_words?.length" class="flex flex-wrap gap-2">
            <button
              v-for="w in ranking.worst_words"
              :key="w.word"
              class="rounded-2xl bg-red-50 border border-red-200 px-4 py-2 text-sm font-black text-red-700 hover:bg-red-100 transition-colors"
              @click="viewWordDetail(w.word)"
            >
              {{ w.word }} <span class="text-red-500">({{ w.score }})</span>
            </button>
          </div>
          <div v-else class="text-sm font-bold text-gray-400">暂无数据</div>
        </section>

        <!-- Strongest Phonemes -->
        <section class="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center">
              <Volume2 class="w-5 h-5 text-green-600" />
            </div>
            <h3 class="text-lg font-black text-gray-900">最强音素</h3>
          </div>
          <div v-if="ranking?.best_phonemes?.length" class="flex flex-wrap gap-2">
            <button
              v-for="p in ranking.best_phonemes"
              :key="p.phoneme"
              class="rounded-2xl bg-green-50 border border-green-200 px-4 py-2 text-sm font-black text-green-700 hover:bg-green-100 transition-colors"
              @click="viewPhonemeDetail(p.phoneme)"
            >
              {{ p.phoneme }} <span class="text-green-500">({{ p.score }})</span>
            </button>
          </div>
          <div v-else class="text-sm font-bold text-gray-400">暂无数据</div>
        </section>

        <!-- Weakest Phonemes -->
        <section class="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
              <Volume2 class="w-5 h-5 text-red-500" />
            </div>
            <h3 class="text-lg font-black text-gray-900">最弱音素</h3>
          </div>
          <div v-if="ranking?.worst_phonemes?.length" class="flex flex-wrap gap-2">
            <button
              v-for="p in ranking.worst_phonemes"
              :key="p.phoneme"
              class="rounded-2xl bg-red-50 border border-red-200 px-4 py-2 text-sm font-black text-red-700 hover:bg-red-100 transition-colors"
              @click="viewPhonemeDetail(p.phoneme)"
            >
              {{ p.phoneme }} <span class="text-red-500">({{ p.score }})</span>
            </button>
          </div>
          <div v-else class="text-sm font-bold text-gray-400">暂无数据</div>
        </section>
      </div>

      <!-- Detail Modal -->
      <div v-if="selectedWord || selectedPhoneme" class="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
        <div class="flex items-center justify-between gap-4">
          <h3 class="text-lg font-black text-gray-900">
            {{ selectedWord ? `单词详情：${selectedWord}` : selectedPhoneme ? `音素详情：${selectedPhoneme}` : '' }}
          </h3>
          <button
            type="button"
            class="text-sm font-black text-gray-400 hover:text-gray-600"
            @click="closeDetail"
          >
            关闭
          </button>
        </div>

        <template v-if="wordDetailReq.loading.value || phonemeDetailReq.loading.value">
          <SkeletonBlock class="h-20 w-full" />
        </template>

        <template v-else-if="wordDetailData || phonemeDetailData">
          <div class="flex flex-col gap-3">
            <div class="rounded-2xl bg-[#F8F9FA] border border-gray-100 p-4 flex items-center justify-between">
              <span class="text-sm font-black text-gray-600">平均分</span>
              <span :class="['text-2xl font-black', scoreColor(wordDetailData?.average_score ?? phonemeDetailData?.average_score ?? 0)]">
                {{ wordDetailData?.average_score ?? phonemeDetailData?.average_score ?? '--' }}
              </span>
            </div>
            <div class="rounded-2xl bg-[#F8F9FA] border border-gray-100 p-4 flex items-center justify-between">
              <span class="text-sm font-black text-gray-600">评测次数</span>
              <span class="text-2xl font-black text-gray-900">{{ wordDetailData?.count ?? phonemeDetailData?.count ?? '--' }}</span>
            </div>
            <div class="rounded-2xl bg-[#F8F9FA] border border-gray-100 p-4 flex items-center justify-between">
              <span class="text-sm font-black text-gray-600">最高分</span>
              <span :class="['text-2xl font-black', scoreColor(wordDetailData?.max_score ?? phonemeDetailData?.max_score ?? 0)]">
                {{ wordDetailData?.max_score ?? phonemeDetailData?.max_score ?? '--' }}
              </span>
            </div>
            <div class="rounded-2xl bg-[#F8F9FA] border border-gray-100 p-4 flex items-center justify-between">
              <span class="text-sm font-black text-gray-600">最低分</span>
              <span :class="['text-2xl font-black', scoreColor(wordDetailData?.min_score ?? phonemeDetailData?.min_score ?? 0)]">
                {{ wordDetailData?.min_score ?? phonemeDetailData?.min_score ?? '--' }}
              </span>
            </div>
          </div>
        </template>
      </div>

      <!-- Search & List -->
      <section class="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
        <div class="flex items-center justify-between gap-4 flex-wrap">
          <h3 class="text-lg font-black text-gray-900">全部历史数据</h3>

          <div class="flex items-center gap-2 bg-[#F8F9FA] border border-gray-100 rounded-2xl px-4 py-2">
            <Search class="w-4 h-4 text-gray-400" />
            <input
              v-model="searchWord"
              class="bg-transparent outline-none text-sm font-bold text-gray-800 placeholder:text-gray-400 w-40"
              placeholder="搜索..."
            />
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex items-center gap-2 border-b border-gray-100 pb-2">
          <button
            type="button"
            class="px-4 py-2 text-sm font-black rounded-2xl transition-colors"
            :class="activeTab === 'words' ? 'bg-[#70C125] text-white' : 'text-gray-400 hover:text-gray-600'"
            @click="activeTab = 'words'"
          >
            <BookOpen class="w-4 h-4 inline mr-1" />
            单词
          </button>
          <button
            type="button"
            class="px-4 py-2 text-sm font-black rounded-2xl transition-colors"
            :class="activeTab === 'phonemes' ? 'bg-[#70C125] text-white' : 'text-gray-400 hover:text-gray-600'"
            @click="activeTab = 'phonemes'"
          >
            <Volume2 class="w-4 h-4 inline mr-1" />
            音素
          </button>
        </div>

        <!-- Word List -->
        <template v-if="activeTab === 'words'">
          <div v-if="wordsReq.loading.value" class="flex flex-wrap gap-3">
            <SkeletonBlock v-for="n in 8" :key="n" class="h-10 w-24" />
          </div>
          <div v-else-if="!filteredWords.length" class="text-sm font-bold text-gray-400 py-8 text-center">
            暂无单词数据
          </div>
          <div v-else class="flex flex-wrap gap-3">
            <button
              v-for="word in filteredWords"
              :key="word"
              type="button"
              class="rounded-2xl border border-gray-100 bg-[#F8F9FA] px-4 py-2 text-sm font-black text-gray-700 hover:bg-[#F4FAEE] hover:border-[#70C125] transition-colors"
              :class="{ 'bg-[#F4FAEE] border-[#70C125]': selectedWord === word }"
              @click="viewWordDetail(word)"
            >
              {{ word }}
            </button>
          </div>
        </template>

        <!-- Phoneme List -->
        <template v-if="activeTab === 'phonemes'">
          <div v-if="phonemesReq.loading.value" class="flex flex-wrap gap-3">
            <SkeletonBlock v-for="n in 8" :key="n" class="h-10 w-24" />
          </div>
          <div v-else-if="!filteredPhonemes.length" class="text-sm font-bold text-gray-400 py-8 text-center">
            暂无音素数据
          </div>
          <div v-else class="flex flex-wrap gap-3">
            <button
              v-for="phoneme in filteredPhonemes"
              :key="phoneme"
              type="button"
              class="rounded-2xl border border-gray-100 bg-[#F8F9FA] px-4 py-2 text-sm font-black text-gray-700 hover:bg-[#F4FAEE] hover:border-[#70C125] transition-colors"
              :class="{ 'bg-[#F4FAEE] border-[#70C125]': selectedPhoneme === phoneme }"
              @click="viewPhonemeDetail(phoneme)"
            >
              {{ phoneme }}
            </button>
          </div>
        </template>
      </section>
    </template>
  </main>
</template>
