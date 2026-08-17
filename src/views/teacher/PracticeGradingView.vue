<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  getTeacherSessionDetails,
  saveTeacherComments,
  type StudentSessionEvaluationItem,
} from '../../api/endpoints'
import { useAsync } from '../../composables/useAsync'
import { useToast } from '../../composables/useToast'
import ErrorState from '../../components/ErrorState.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'

interface SentenceResult {
  id: string
  text: string
  score: number
  teacherComment: string
}

interface StudentSubmission {
  id: string
  studentName: string
  contentTitle: string
  score: number | null
  status: 'pending' | 'graded'
  submittedAt: string
  sentences: SentenceResult[]
  overallComment: string
}

const route = useRoute()
const toast = useToast()
const detailsReq = useAsync<StudentSessionEvaluationItem[]>()
const saveReq = useAsync<{ success: boolean }>()
const submissions = ref<StudentSubmission[]>([])
const selectedSubmission = ref<StudentSubmission | null>(null)
const gradingModalOpen = ref(false)
const activeSentenceIdx = ref(0)

const openGrading = (sub: StudentSubmission) => {
  selectedSubmission.value = sub
  activeSentenceIdx.value = 0
  gradingModalOpen.value = true
}

const closeGrading = () => {
  gradingModalOpen.value = false
  selectedSubmission.value = null
}

const activeSentence = computed(() => {
  if (!selectedSubmission.value) return null
  return selectedSubmission.value.sentences[activeSentenceIdx.value] ?? null
})

const meta = computed(() => ({
  userId: route.query.userId as string | undefined,
  sessionId: route.query.sessionId as string | undefined,
  taskId: route.query.taskId as string | undefined,
}))

const mapDetails = (details: StudentSessionEvaluationItem[]) => {
  const submission: StudentSubmission = {
    id: meta.value.sessionId ?? 'session',
    studentName: meta.value.userId ? `学生 ${meta.value.userId}` : '学生',
    contentTitle: meta.value.taskId ? `任务 ${meta.value.taskId}` : '练习内容',
    score: details.length ? details.reduce((sum, item) => sum + item.total_score, 0) / details.length : null,
    status: 'pending',
    submittedAt: details[0]?.created_at ?? '-',
    sentences: details.map((item) => ({
      id: item.eval_id,
      text: item.sentence_text,
      score: Math.round(item.total_score / 20) || 1,
      teacherComment: item.teacher_notes ?? '',
    })),
    overallComment: '',
  }
  submissions.value = [submission]
  openGrading(submission)
}

const load = async () => {
  if (!meta.value.userId || !meta.value.sessionId) return
  const details = await detailsReq.run(() => getTeacherSessionDetails(meta.value.userId!, meta.value.sessionId!))
  mapDetails(details)
}

const submitFeedback = async () => {
  if (!selectedSubmission.value || !meta.value.sessionId) return
  const comment = {
    [meta.value.sessionId]: {
      comment: selectedSubmission.value.overallComment,
      evaluations: Object.fromEntries(
        selectedSubmission.value.sentences.map((item) => [item.id, item.teacherComment]),
      ),
    },
  }
  await saveReq.run(() => saveTeacherComments(comment))
  toast.push('评语已提交', 'success')
  selectedSubmission.value.status = 'graded'
}

onMounted(() => {
  void load()
})
</script>

<template>
  <div class="p-8 flex flex-col gap-8">
    <div class="flex items-start justify-between">
      <div>
        <h2 class="text-2xl font-black text-[#1F2937] tracking-tight">批改面板</h2>
        <p class="text-sm font-bold text-[#9CA3AF] mt-1">逐句评价学生的发音练习</p>
      </div>
    </div>

    <ErrorState
      v-if="detailsReq.error.value"
      :message="detailsReq.error.value"
      :busy="detailsReq.loading.value"
      @retry="load"
    />

    <div class="flex gap-8">
      <div class="flex-1">
        <div class="bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
          <div class="bg-[#F8FAFC] px-6 py-3 grid grid-cols-5 gap-4">
            <span class="text-xs font-black text-[#64748B] uppercase tracking-wider">学生</span>
            <span class="text-xs font-black text-[#64748B] uppercase tracking-wider">练习内容</span>
            <span class="text-xs font-black text-[#64748B] uppercase tracking-wider">得分</span>
            <span class="text-xs font-black text-[#64748B] uppercase tracking-wider">状态</span>
            <span class="text-xs font-black text-[#64748B] uppercase tracking-wider">操作</span>
          </div>

          <div v-if="detailsReq.loading.value" class="p-6">
            <SkeletonBlock class="h-12 w-full" />
          </div>

          <div v-else-if="submissions.length === 0" class="py-20 text-center">
            <div class="w-16 h-16 rounded-full bg-[#F1F5F9] mx-auto flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="1.5"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
            </div>
            <p class="text-sm font-bold text-[#9CA3AF]">暂无待批改的提交</p>
          </div>

          <div
            v-for="sub in submissions"
            :key="sub.id"
            class="grid grid-cols-5 gap-4 px-6 py-4 border-t border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors"
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
            <td>
              <button
                class="text-xs font-bold text-[#356B00] hover:underline"
                @click="openGrading(sub)"
              >
                进入批改
              </button>
            </td>
          </div>
        </div>
      </div>

      <div class="w-[290px] shrink-0 flex flex-col gap-6">
        <div class="bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6 flex flex-col gap-4" style="border-left: 4px solid #01658B;">
          <span class="text-xs font-black text-[#9CA3AF] uppercase tracking-widest">提交总数</span>
          <span class="text-3xl font-black text-[#1F2937]">{{ submissions.length }}</span>
        </div>
        <div class="bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6 flex flex-col gap-4" style="border-left: 4px solid #FFB800;">
          <span class="text-xs font-black text-[#9CA3AF] uppercase tracking-widest">待批改</span>
          <span class="text-3xl font-black text-[#1F2937]">{{ submissions.filter(s => s.status === 'pending').length }}</span>
        </div>
        <div class="bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6 flex flex-col gap-4" style="border-left: 4px solid #356B00;">
          <span class="text-xs font-black text-[#9CA3AF] uppercase tracking-widest">已批改</span>
          <span class="text-3xl font-black text-[#1F2937]">{{ submissions.filter(s => s.status === 'graded').length }}</span>
        </div>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div
      v-if="gradingModalOpen"
      class="fixed inset-0 z-50 bg-black/40 backdrop-blur-[7px] flex items-center justify-center"
      @click.self="closeGrading"
    >
      <div class="bg-white rounded-2xl shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] flex overflow-hidden" style="width: 1000px; height: 750px;">
        <div class="w-[260px] shrink-0 bg-white border-r border-[#F1F5F9] flex flex-col">
          <div class="px-4 py-4 border-b border-[#F1F5F9]">
            <h3 class="text-sm font-black text-[#1F2937]">句子列表</h3>
            <p class="text-xs font-bold text-[#9CA3AF] mt-0.5">{{ selectedSubmission?.studentName }}</p>
          </div>
          <div class="flex-1 overflow-auto">
            <button
              v-for="(sentence, idx) in selectedSubmission?.sentences"
              :key="sentence.id"
              :class="[
                'w-full text-left px-4 py-3 border-b border-[#F8FAFC] transition-colors',
                idx === activeSentenceIdx
                  ? 'bg-[#F2F5E8] border-l-2 border-l-[#356B00]'
                  : 'hover:bg-[#F8FAFC]',
              ]"
              @click="activeSentenceIdx = idx"
            >
              <span class="text-xs font-bold text-[#64748B]">句子 {{ idx + 1 }}</span>
              <p class="text-sm font-bold text-[#1F2937] mt-1 line-clamp-2">{{ sentence.text }}</p>
              <span class="text-xs font-black text-[#356B00]">{{ sentence.score }}分</span>
            </button>
          </div>
        </div>

        <div class="flex-1 flex flex-col p-6 overflow-auto">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="text-lg font-black text-[#1F2937]">逐句评价</h3>
              <p class="text-sm text-[#9CA3AF] font-bold">句子 {{ activeSentenceIdx + 1 }} / {{ selectedSubmission?.sentences.length }}</p>
            </div>
            <div class="flex items-center gap-3">
              <button class="px-4 py-2 rounded-lg border border-[#E2E8F0] text-sm font-bold text-[#475569] hover:bg-[#F8FAFC] transition-colors">保存草稿</button>
              <button
                class="px-4 py-2 rounded-lg bg-[#356B00] text-white text-sm font-bold hover:bg-[#2E5E00] transition-colors disabled:opacity-60"
                :disabled="saveReq.loading.value"
                @click="submitFeedback"
              >
                {{ saveReq.loading.value ? '提交中...' : '提交评分' }}
              </button>
            </div>
          </div>

          <div v-if="activeSentence" class="flex flex-col gap-6">
            <div class="bg-[#F8FAFC] rounded-xl p-4">
              <p class="text-sm font-black text-[#9CA3AF] uppercase tracking-wider mb-2">原文</p>
              <p class="text-base font-bold text-[#1F2937]">{{ activeSentence.text }}</p>
            </div>

            <div class="flex flex-col gap-3">
              <span class="text-sm font-black text-[#9CA3AF] uppercase tracking-wider">评分</span>
              <div class="flex items-center gap-2">
                <button
                  v-for="score in [1, 2, 3, 4, 5]"
                  :key="score"
                  :class="[
                    'w-10 h-10 rounded-lg text-sm font-black transition-colors',
                    score <= activeSentence.score
                      ? 'bg-[#356B00] text-white'
                      : 'bg-[#F1F5F9] text-[#9CA3AF] hover:bg-[#E2E8F0]',
                  ]"
                >
                  {{ score }}
                </button>
              </div>
            </div>

            <div class="flex flex-col gap-3">
              <span class="text-sm font-black text-[#9CA3AF] uppercase tracking-wider">教师评语</span>
              <textarea
                v-model="activeSentence.teacherComment"
                class="w-full h-32 rounded-xl border border-[#E2E8F0] p-4 text-sm text-[#1F2937] placeholder-[#9CA3AF] outline-none focus:border-[#58CC02] resize-none"
                placeholder="输入对该句子的评价..."
              />
            </div>
          </div>

          <div v-if="selectedSubmission" class="mt-auto pt-6 border-t border-[#F1F5F9]">
            <span class="text-sm font-black text-[#9CA3AF] uppercase tracking-wider">总体评价</span>
            <textarea
              v-model="selectedSubmission.overallComment"
              class="w-full h-24 rounded-xl border border-[#E2E8F0] p-4 text-sm text-[#1F2937] placeholder-[#9CA3AF] outline-none focus:border-[#58CC02] resize-none mt-3"
              placeholder="输入总体评语..."
            />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
