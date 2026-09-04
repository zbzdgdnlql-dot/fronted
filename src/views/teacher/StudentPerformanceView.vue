<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, BarChart3, Volume2, Activity, Target, Award, Clock, Calendar } from 'lucide-vue-next'
import { useAsync } from '../../composables/useAsync'
import {
  getStudentAnalysis,
  getStudentProgress,
  type StudentAnalysisResponse,
  type StudentProgressResponse,
} from '../../api/endpoints'
import ErrorState from '../../components/ErrorState.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import EmptyState from '../../components/EmptyState.vue'

const route = useRoute()
const router = useRouter()
const classId = computed(() => route.params.classId as string)
const userId = computed(() => route.params.userId as string)
const activeTab = ref<'overview' | 'pronunciation' | 'rhythm' | 'fluency' | 'completeness'>('overview')

const analysisReq = useAsync<StudentAnalysisResponse | null>()
const progressReq = useAsync<StudentProgressResponse | null>()

const loading = computed(() => analysisReq.loading.value || progressReq.loading.value)
const error = computed(() => analysisReq.error.value || progressReq.error.value)

const analysis = computed(() => analysisReq.data.value)
const progress = computed(() => progressReq.data.value)

const tabs = [
  { id: 'overview' as const, label: '总览', icon: BarChart3 },
  { id: 'pronunciation' as const, label: '发音', icon: Volume2 },
  { id: 'rhythm' as const, label: '节奏', icon: Activity },
  { id: 'fluency' as const, label: '流畅', icon: Target },
  { id: 'completeness' as const, label: '完整', icon: Award },
]

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

const load = async () => {
  await Promise.all([
    analysisReq.run(() => getStudentAnalysis(classId.value, userId.value)),
    progressReq.run(() => getStudentProgress(userId.value)),
  ])
}

const studentName = computed(() => analysis.value?.student_name || progress.value?.student_name || `学生 ${userId.value}`)

onMounted(() => {
  void load()
})
</script>

<template>
  <main class="flex-1 w-full max-w-[1440px] mx-auto p-8 flex flex-col gap-8">
    <nav class="flex items-center gap-2 text-sm font-bold text-gray-400">
      <button
        type="button"
        class="hover:text-gray-600 transition-colors"
        @click="router.push('/teacher/classes')"
      >
        班级管理
      </button>
      <span>/</span>
      <span class="text-gray-600">学生表现</span>
      <span>/</span>
      <span class="text-gray-800">{{ studentName }}</span>
    </nav>

    <ErrorState
      v-if="error && !loading"
      title="加载失败"
      message="无法获取学生表现数据，请稍后重试。"
      :busy="loading"
      @retry="load"
    />

    <template v-if="loading">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonBlock v-for="n in 3" :key="n" class="h-28 w-full" />
      </div>
      <SkeletonBlock class="h-64 w-full" />
    </template>

    <EmptyState
      v-else-if="!analysis && !progress"
      title="暂无表现数据"
      description="该学生暂无评测记录。"
    />

    <template v-else>
      <!-- Student Header -->
      <div class="flex items-center justify-between gap-6">
        <div class="flex flex-col gap-2">
          <h2 class="text-2xl font-black text-gray-900 tracking-tight">{{ studentName }}</h2>
          <p class="text-sm font-bold text-gray-400">学生详细表现分析</p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-2 text-sm font-black text-gray-500 hover:text-gray-700"
          @click="router.push(`/teacher/classes/${classId}/organize`)"
        >
          <ChevronLeft class="w-4 h-4" />
          返回班级
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <div class="w-10 h-10 rounded-2xl bg-[#F4FAEE] border border-[#EAF0DD] flex items-center justify-center">
            <BarChart3 class="w-5 h-5 text-[#70C125]" />
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs font-black text-gray-400 uppercase tracking-widest">评测次数</span>
            <strong class="text-3xl font-black text-gray-900">{{ analysis?.evaluation_count ?? progress?.evaluation_count ?? 0 }}</strong>
          </div>
        </div>
        <div class="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <div class="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <Calendar class="w-5 h-5 text-blue-600" />
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs font-black text-gray-400 uppercase tracking-widest">首次评测</span>
            <strong class="text-lg font-black text-gray-900">{{ analysis?.first_evaluation_at || '--' }}</strong>
          </div>
        </div>
        <div class="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <div class="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center">
            <Clock class="w-5 h-5 text-purple-600" />
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs font-black text-gray-400 uppercase tracking-widest">最近评测</span>
            <strong class="text-lg font-black text-gray-900">{{ analysis?.last_evaluation_at || '--' }}</strong>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
        <div class="flex items-center border-b border-gray-100 px-2">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            class="flex items-center gap-2 px-5 py-4 text-sm font-black transition-colors border-b-2 -mb-[1px]"
            :class="activeTab === tab.id ? 'text-[#70C125] border-[#70C125]' : 'text-gray-400 border-transparent hover:text-gray-600'"
            @click="activeTab = tab.id"
          >
            <component :is="tab.icon" class="w-4 h-4" />
            {{ tab.label }}
          </button>
        </div>

        <div class="p-6">
          <!-- Overview Tab -->
          <template v-if="activeTab === 'overview'">
            <div class="flex flex-col gap-6">
              <!-- Dimension Scores -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div
                  v-for="dim in ['pronunciation', 'rhythm', 'fluency', 'completeness'] as const"
                  :key="dim"
                  class="rounded-2xl bg-[#F8F9FA] border border-gray-100 p-4 flex flex-col gap-2"
                >
                  <span class="text-xs font-black text-gray-400 uppercase">{{ dim === 'pronunciation' ? '发音' : dim === 'rhythm' ? '节奏' : dim === 'fluency' ? '流畅' : '完整' }}</span>
                  <span :class="['text-3xl font-black', scoreColor(analysis?.dimension_scores?.[dim] ?? 0)]">
                    {{ analysis?.dimension_scores?.[dim] ?? '--' }}
                  </span>
                </div>
              </div>

              <!-- Weak Areas -->
              <div v-if="analysis?.weak_phonemes?.length || analysis?.difficult_words?.length" class="flex flex-col gap-4">
                <h3 class="text-lg font-black text-gray-900">薄弱区域</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div v-if="analysis?.weak_phonemes?.length" class="rounded-2xl bg-red-50 border border-red-100 p-4 flex flex-col gap-2">
                    <span class="text-xs font-black text-red-500 uppercase tracking-widest">薄弱音素</span>
                    <div class="flex flex-wrap gap-2">
                      <span
                        v-for="p in analysis.weak_phonemes"
                        :key="p"
                        class="rounded-xl bg-white border border-red-200 px-3 py-1 text-xs font-black text-red-700"
                      >
                        {{ p }}
                      </span>
                    </div>
                  </div>
                  <div v-if="analysis?.difficult_words?.length" class="rounded-2xl bg-yellow-50 border border-yellow-100 p-4 flex flex-col gap-2">
                    <span class="text-xs font-black text-yellow-600 uppercase tracking-widest">困难单词</span>
                    <div class="flex flex-wrap gap-2">
                      <span
                        v-for="w in analysis.difficult_words"
                        :key="w"
                        class="rounded-xl bg-white border border-yellow-200 px-3 py-1 text-xs font-black text-yellow-700"
                      >
                        {{ w }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- Dimension Tabs -->
          <template v-if="activeTab !== 'overview'">
            <div class="flex flex-col gap-6">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-black text-gray-900">{{ tabs.find(t => t.id === activeTab)?.label }} 得分</h3>
                <span :class="['text-4xl font-black', scoreColor(analysis?.dimension_scores?.[activeTab] ?? 0)]">
                  {{ analysis?.dimension_scores?.[activeTab] ?? '--' }}
                </span>
              </div>

              <!-- Progress Data -->
              <div v-if="progress?.scores?.length" class="flex flex-col gap-3">
                <h4 class="text-sm font-black text-gray-400 uppercase tracking-widest">历史趋势</h4>
                <div class="flex flex-col gap-2">
                  <div
                    v-for="(item, idx) in progress.scores.slice(-10).reverse()"
                    :key="idx"
                    class="flex items-center gap-4 rounded-2xl bg-[#F8F9FA] border border-gray-100 p-4"
                  >
                    <span class="text-xs font-bold text-gray-400 w-32 shrink-0">{{ item.date || item.created_at || '--' }}</span>
                    <div class="flex-1 h-3 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        :class="['h-full rounded-full', barColor(item[activeTab] ?? 0)]"
                        :style="{ width: (item[activeTab] ?? 0) + '%' }"
                      ></div>
                    </div>
                    <span :class="['text-sm font-black w-10 text-right', scoreColor(item[activeTab] ?? 0)]">
                      {{ item[activeTab] ?? '--' }}
                    </span>
                  </div>
                </div>
              </div>
              <div v-else class="text-sm font-bold text-gray-400 py-8 text-center">
                暂无历史趋势数据
              </div>
            </div>
          </template>
        </div>
      </div>
    </template>
  </main>
</template>
