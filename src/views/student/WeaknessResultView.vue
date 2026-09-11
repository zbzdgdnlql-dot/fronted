<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronLeft } from 'lucide-vue-next'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import ErrorState from '../../components/ErrorState.vue'
import EmptyState from '../../components/EmptyState.vue'
import { useAsync } from '../../composables/useAsync'
import { getStudentSessionDetails } from '../../api/endpoints'
import router from '../../router'

const route = useRoute()
const sessionId = computed(() => (route.query.session_id as string) || '')

const detailFromExisting = useAsync<Awaited<ReturnType<typeof getStudentSessionDetails>>>()

const loading = computed(() => detailFromExisting.loading.value)
const error = computed(() => detailFromExisting.error.value)

const existingDetails = computed(() => detailFromExisting.data.value?.details)

const totalScore = computed(() => {
  const details = existingDetails.value
  if (!details?.length) return null
  const scores = details.filter(d => d.total_score != null)
  if (!scores.length) return null
  return Math.round(scores.reduce((s, d) => s + d.total_score, 0) / scores.length)
})

const sentences = computed(() =>
  (existingDetails.value ?? []).map(d => ({
    sentence_text: d.sentence_text,
    pronunciation: d.pronunciation,
    rhythm: d.rhythm,
    fluency: d.fluency,
    completeness: d.completeness,
    total_score: d.total_score,
  })),
)

const submitTime = computed(() => existingDetails.value?.[0]?.created_at ?? null)

const scoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-red-500'
}

const scoreBg = (score: number) => {
  if (score >= 80) return 'bg-green-50 border-green-200'
  if (score >= 60) return 'bg-yellow-50 border-yellow-200'
  return 'bg-red-50 border-red-200'
}

const barColor = (score: number) => {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
}

const load = async () => {
  if (!sessionId.value) return
  await detailFromExisting.run(() => getStudentSessionDetails(sessionId.value))
}

onMounted(() => {
  void load()
})
</script>

<template>
  <main class="flex-1 w-full max-w-[1440px] mx-auto p-8 flex flex-col gap-8">
    <button
      type="button"
      class="inline-flex items-center gap-2 text-sm font-black text-gray-500 hover:text-gray-700 w-fit"
      @click="router.push('/')"
    >
      <ChevronLeft class="w-4 h-4" />
      返回主页
    </button>

    <ErrorState
      v-if="error && !loading"
      title="加载失败"
      message="无法获取评测结果，请稍后重试。"
      :busy="loading"
      @retry="load"
    />

    <template v-if="loading">
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div class="xl:col-span-5 flex flex-col gap-6">
          <SkeletonBlock class="h-40 w-full" />
          <SkeletonBlock class="h-60 w-full" />
        </div>
        <div class="xl:col-span-7">
          <SkeletonBlock class="h-80 w-full" />
        </div>
      </div>
    </template>

    <template v-else-if="!sessionId">
      <EmptyState
        title="缺少评测信息"
        description="请从评测页面进入此处查看结果。"
      />
    </template>

    <template v-else-if="!sentences.length">
      <EmptyState
        title="暂无评测数据"
        description="该评测会话暂无可展示的结果数据。"
      />
    </template>

    <template v-else>
      <!-- Score Header -->
      <div class="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="flex flex-col gap-2">
          <h2 class="text-2xl font-black text-gray-900 tracking-tight">评测结果</h2>
          <p v-if="submitTime" class="text-sm font-bold text-gray-400">
            提交时间：{{ new Date(submitTime).toLocaleString('zh-CN', { hour12: false }) }}
          </p>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-right">
            <div class="text-xs font-black text-gray-400 uppercase tracking-widest">总分</div>
            <div :class="['text-5xl font-black', scoreColor(totalScore ?? 0)]">
              {{ totalScore ?? '--' }}
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <!-- Per-Sentence Details -->
        <div class="xl:col-span-12 flex flex-col gap-4">
          <section class="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <div class="flex items-center justify-between gap-4">
              <h3 class="text-lg font-black text-gray-900">逐句评分</h3>
              <span class="text-sm font-bold text-gray-400">{{ sentences.length }} 句</span>
            </div>

            <div class="flex flex-col gap-4">
              <div
                v-for="(s, idx) in sentences"
                :key="idx"
                :class="['rounded-2xl border p-5 flex flex-col gap-3', scoreBg(s.total_score)]"
              >
                <div class="flex items-start justify-between gap-3">
                  <span class="text-sm font-black text-gray-800 flex-1">{{ s.sentence_text }}</span>
                  <span :class="['text-2xl font-black shrink-0', scoreColor(s.total_score)]">
                    {{ s.total_score }}
                  </span>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div class="flex flex-col gap-1">
                    <span class="text-xs font-black text-gray-400">发音</span>
                    <div class="flex items-center gap-2">
                      <div class="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div :class="['h-full rounded-full', barColor(s.pronunciation)]" :style="{ width: s.pronunciation + '%' }"></div>
                      </div>
                      <span class="text-xs font-black text-gray-600 w-6 text-right">{{ s.pronunciation }}</span>
                    </div>
                  </div>
                  <div class="flex flex-col gap-1">
                    <span class="text-xs font-black text-gray-400">节奏</span>
                    <div class="flex items-center gap-2">
                      <div class="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div :class="['h-full rounded-full', barColor(s.rhythm)]" :style="{ width: s.rhythm + '%' }"></div>
                      </div>
                      <span class="text-xs font-black text-gray-600 w-6 text-right">{{ s.rhythm }}</span>
                    </div>
                  </div>
                  <div class="flex flex-col gap-1">
                    <span class="text-xs font-black text-gray-400">流畅</span>
                    <div class="flex items-center gap-2">
                      <div class="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div :class="['h-full rounded-full', barColor(s.fluency)]" :style="{ width: s.fluency + '%' }"></div>
                      </div>
                      <span class="text-xs font-black text-gray-600 w-6 text-right">{{ s.fluency }}</span>
                    </div>
                  </div>
                  <div class="flex flex-col gap-1">
                    <span class="text-xs font-black text-gray-400">完整</span>
                    <div class="flex items-center gap-2">
                      <div class="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div :class="['h-full rounded-full', barColor(s.completeness)]" :style="{ width: s.completeness + '%' }"></div>
                      </div>
                      <span class="text-xs font-black text-gray-600 w-6 text-right">{{ s.completeness }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </template>
  </main>
</template>
