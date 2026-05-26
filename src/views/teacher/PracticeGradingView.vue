<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ChevronLeft, Filter, Search, Mic, Paperclip, Save } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'
import { getTeacherSessionDetails, saveTeacherComments, type StudentSessionEvaluationItem } from '../../api/endpoints'
import { useAsync } from '../../composables/useAsync'
import { useToast } from '../../composables/useToast'
import ErrorState from '../../components/ErrorState.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const detailsReq = useAsync<StudentSessionEvaluationItem[]>()
const saveReq = useAsync<void>()

const meta = computed(() => {
  return {
    classLabel: (route.query.classId as string | undefined) ?? '--',
    taskId: (route.query.taskId as string | undefined) ?? '--',
    userId: (route.query.userId as string | undefined) ?? '',
    studentName: (route.query.student as string | undefined) ?? '--',
    sessionId: (route.query.sessionId as string | undefined) ?? '--',
  }
})

const keyword = ref('')

const selectedSentenceIndex = ref(1)
const selectedToken = ref('')
const feedback = ref('')

const details = computed(() => detailsReq.data.value ?? [])
const totalSentences = computed(() => details.value.length)
const selectedEvaluation = computed(() => details.value[Math.max(0, selectedSentenceIndex.value - 1)] ?? null)

const filteredDetails = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  if (!k) return details.value
  return details.value.filter((item) => item.sentence_text.toLowerCase().includes(k))
})

const load = async () => {
  if (!meta.value.userId || meta.value.sessionId === '--') return
  const res = await detailsReq.run(() => getTeacherSessionDetails(meta.value.userId, meta.value.sessionId))
  selectedSentenceIndex.value = res.length ? 1 : 0
  feedback.value = res[0]?.teacher_notes ?? ''
}

const selectSentence = (item: StudentSessionEvaluationItem) => {
  selectedSentenceIndex.value = item.line_number
  feedback.value = item.teacher_notes ?? ''
}

const submitFeedback = async () => {
  if (!selectedEvaluation.value || meta.value.sessionId === '--') return
  await saveReq.run(async () => {
    const evaluations = Object.fromEntries(
      details.value.map((item) => [
        item.eval_id,
        item.eval_id === selectedEvaluation.value?.eval_id ? feedback.value : item.teacher_notes ?? '',
      ]),
    )
    await saveTeacherComments({
      [meta.value.sessionId]: {
        comment: feedback.value,
        evaluations,
      },
    })
  })
  toast.push('批改已保存', 'success')
  await load()
}

onMounted(load)
</script>

<template>
  <main class="flex-1 w-full max-w-[1440px] mx-auto p-8">
    <div class="flex flex-col gap-8">
      <div class="flex items-start justify-between gap-6 flex-wrap">
        <div class="flex flex-col gap-2">
          <h2 class="text-2xl font-black text-gray-900 tracking-tight">练习提交</h2>
          <div class="flex flex-wrap items-center gap-3">
            <div class="bg-white border border-gray-100 rounded-full px-4 py-2 text-sm font-black text-gray-600">
              班级: {{ meta.classLabel }}
            </div>
            <div class="bg-white border border-gray-100 rounded-full px-4 py-2 text-sm font-black text-gray-600">
              任务 ID: {{ meta.taskId }}
            </div>
            <div class="bg-white border border-gray-100 rounded-full px-4 py-2 text-sm font-black text-gray-600">
              Session ID: {{ meta.sessionId }}
            </div>
          </div>
        </div>

        <button
          type="button"
          class="inline-flex items-center gap-2 text-sm font-black text-gray-500 hover:text-gray-700"
          @click="router.push({ path: '/teacher/submissions', query: { classId: meta.classLabel, taskId: meta.taskId } })"
        >
          <ChevronLeft class="w-4 h-4" />
          返回练习管理
        </button>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <ErrorState
          v-if="detailsReq.error.value"
          class="xl:col-span-7"
          title="加载失败"
          message="无法获取句子明细，请稍后重试。"
          :busy="detailsReq.loading.value"
          @retry="load"
        />

        <section v-else class="xl:col-span-7 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col gap-6">
          <div class="flex items-center justify-between gap-4 flex-wrap">
            <h3 class="text-lg font-black text-gray-900">句子明细</h3>
            <div class="flex items-center gap-3">
              <div class="bg-[#F8F9FA] border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2">
                <Search class="w-4 h-4 text-gray-400" />
                <input
                  v-model="keyword"
                  class="bg-transparent outline-none text-sm font-bold text-gray-800 placeholder:text-gray-400 w-52"
                  placeholder="筛选"
                />
              </div>
              <div class="w-11 h-11 rounded-2xl bg-[#F8F9FA] border border-gray-100 flex items-center justify-center">
                <Filter class="w-5 h-5 text-gray-700" />
              </div>
            </div>
          </div>

          <div class="overflow-hidden rounded-2xl border border-gray-100">
            <table class="w-full text-left">
              <thead class="bg-[#F8F9FA]">
                <tr class="text-xs font-black text-gray-400 uppercase tracking-widest">
                  <th class="px-5 py-4">句子</th>
                  <th class="px-5 py-4">总分</th>
                  <th class="px-5 py-4">发音</th>
                  <th class="px-5 py-4">时间</th>
                </tr>
              </thead>
              <tbody class="bg-white">
                <tr v-if="detailsReq.loading.value">
                  <td class="px-5 py-4" colspan="4">
                    <div class="flex flex-col gap-3">
                      <SkeletonBlock class="h-10 w-full" />
                      <SkeletonBlock class="h-10 w-full" />
                      <SkeletonBlock class="h-10 w-full" />
                    </div>
                  </td>
                </tr>
                <tr v-else-if="filteredDetails.length === 0">
                  <td class="px-5 py-8 text-sm font-bold text-gray-500" colspan="4">暂无句子明细</td>
                </tr>
                <tr
                  v-for="item in filteredDetails"
                  v-else
                  :key="item.eval_id"
                  class="border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50"
                  @click="selectSentence(item)"
                >
                  <td class="px-5 py-4">
                    <div class="text-xs font-black text-gray-400">第 {{ item.line_number }} 句</div>
                    <div class="text-sm font-extrabold text-gray-900 line-clamp-2">{{ item.sentence_text }}</div>
                  </td>
                  <td class="px-5 py-4 text-sm font-black text-gray-700">{{ item.total_score }}</td>
                  <td class="px-5 py-4 text-sm font-black text-gray-700">{{ item.pronunciation }}</td>
                  <td class="px-5 py-4 text-sm font-bold text-gray-600">{{ item.created_at }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex items-center justify-between text-sm font-bold text-gray-400">
            <div>共 {{ filteredDetails.length }} 个句子</div>
            <div class="text-sm font-black text-gray-500">历史</div>
          </div>
        </section>

        <section class="xl:col-span-5 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col gap-6">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-black text-gray-900">作业内容</h3>
            <div class="text-sm font-bold text-gray-400">{{ meta.studentName }}</div>
          </div>

          <div class="bg-[#F8F9FA] border border-gray-100 rounded-2xl p-4">
            <div class="text-sm font-extrabold text-gray-900 mb-2">选择一个句子进行批改</div>
            <div class="flex items-center justify-between gap-3">
              <div class="text-sm font-bold text-gray-500">第 <span class="font-black text-gray-900">{{ selectedSentenceIndex }}</span> / {{ totalSentences }} 句</div>
              <input
                v-model.number="selectedSentenceIndex"
                type="range"
                min="1"
                :max="Math.max(totalSentences, 1)"
                class="w-40"
                :disabled="totalSentences === 0"
              />
            </div>
          </div>

          <div class="flex flex-col gap-4">
            <div class="text-xs font-black text-gray-400 uppercase tracking-widest">发音检测 / PRONUNCIATION</div>
            <div class="bg-[#F8F9FA] border border-gray-100 rounded-2xl p-4 flex items-center justify-between">
              <div class="text-lg font-black text-gray-900">{{ selectedToken || selectedEvaluation?.sentence_text || '--' }}</div>
              <div class="text-sm font-black text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                {{ selectedEvaluation ? `${selectedEvaluation.total_score} 分` : '暂无' }}
              </div>
            </div>

            <div class="bg-[#F8F9FA] border border-gray-100 rounded-2xl p-4">
              <div class="flex items-center justify-between text-sm font-bold text-gray-500 mb-3">
                <span>发音 {{ selectedEvaluation?.pronunciation ?? '--' }} · 流利 {{ selectedEvaluation?.fluency ?? '--' }}</span>
                <Mic class="w-4 h-4 text-gray-500" />
              </div>
              <div class="h-2 rounded-full bg-white border border-gray-100 overflow-hidden">
                <div class="h-full w-1/3 bg-[#70C125]" />
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-3">
            <div class="text-xs font-black text-gray-400 uppercase tracking-widest">教师评语 / Feedback</div>
            <textarea
              v-model="feedback"
              class="w-full min-h-[140px] bg-[#F8F9FA] border border-gray-100 rounded-2xl p-4 outline-none resize-none text-sm font-medium text-gray-800 placeholder:text-gray-400"
              placeholder="在此输入针对该句子的具体反馈..."
            />
          </div>

          <div class="flex items-center gap-3 flex-wrap">
            <button type="button" class="bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm font-black text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <Mic class="w-4 h-4" />
              语音评注
            </button>
            <button type="button" class="bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm font-black text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <Paperclip class="w-4 h-4" />
              附件
            </button>
          </div>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button type="button" class="bg-white border border-gray-100 rounded-2xl px-5 py-3 text-sm font-black text-gray-700 hover:bg-gray-50">
              取消
            </button>
            <button
              type="button"
              class="bg-[#70C125] text-white rounded-2xl px-5 py-3 text-sm font-black hover:bg-[#63ad20] border-b-4 border-[#5E9E1A] active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              :disabled="saveReq.loading.value || !selectedEvaluation"
              @click="submitFeedback"
            >
              <Save class="w-4 h-4" />
              {{ saveReq.loading.value ? '保存中...' : '提交批改' }}
            </button>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>
