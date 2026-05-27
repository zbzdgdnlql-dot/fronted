<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getTeacherClasses,
  getTeacherTaskRecords,
  getTeacherTasks,
  type TeacherClassItem,
  type TeacherTaskItem,
  type TeacherTaskRecordStudent,
} from '../../api/endpoints'
import { useAsync } from '../../composables/useAsync'
import ErrorState from '../../components/ErrorState.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'

interface Submission {
  id: string
  userId: number
  sessionId: string
  studentName: string
  contentTitle: string
  score: number | null
  status: 'pending' | 'graded'
  submittedAt: string
}

const route = useRoute()
const router = useRouter()
const classesReq = useAsync<TeacherClassItem[]>()
const tasksReq = useAsync<TeacherTaskItem[]>()
const recordsReq = useAsync<TeacherTaskRecordStudent[]>()
const classes = ref<TeacherClassItem[]>([])
const tasks = ref<TeacherTaskItem[]>([])
const submissions = ref<Submission[]>([])
const selectedClassId = ref((route.query.classId as string | undefined) ?? '')
const selectedTaskId = ref((route.query.taskId as string | undefined) ?? '')

const availableTasks = computed(() => {
  if (!selectedClassId.value) return tasks.value
  return tasks.value.filter((task) => task.course.some((course) => course.class_id === selectedClassId.value))
})

const selectedClass = computed(() => classes.value.find((item) => item.class_id === selectedClassId.value))
const selectedTask = computed(() => tasks.value.find((item) => String(item.task_id) === String(selectedTaskId.value)))

const stats = computed(() => ({
  total: submissions.value.length,
  pending: submissions.value.filter(s => s.status === 'pending').length,
  graded: submissions.value.filter(s => s.status === 'graded').length,
  avgScore: submissions.value.reduce((sum, s) => sum + (s.score ?? 0), 0) / (submissions.value.filter(s => s.score != null).length || 1),
}))

const heading = computed(() => `${selectedClass.value?.class_name ?? '班级'} · ${selectedTask.value?.title ?? '练习提交'}`)

const mapRecords = (rows: TeacherTaskRecordStudent[]) => {
  const taskTitle = selectedTask.value?.title ?? '未命名任务'
  submissions.value = rows.flatMap((student) => {
    if (!student.records.length) {
      return [{
        id: `${student.user_id}-empty`,
        userId: student.user_id,
        sessionId: '',
        studentName: student.username,
        contentTitle: taskTitle,
        score: null,
        status: 'pending' as const,
        submittedAt: '-',
      }]
    }
    return student.records.map((record) => ({
      id: `${student.user_id}-${record.session_id}`,
      userId: student.user_id,
      sessionId: record.session_id,
      studentName: student.username,
      contentTitle: taskTitle,
      score: record.average_score,
      status: record.average_score == null ? 'pending' as const : 'graded' as const,
      submittedAt: record.completed_at ?? '-',
    }))
  })
}

const loadRecords = async () => {
  if (!selectedClassId.value || !selectedTaskId.value) {
    submissions.value = []
    return
  }
  const rows = await recordsReq.run(() => getTeacherTaskRecords(selectedClassId.value, selectedTaskId.value))
  mapRecords(rows)
}

const load = async () => {
  const [classRows, taskRows] = await Promise.all([
    classesReq.run(() => getTeacherClasses()),
    tasksReq.run(() => getTeacherTasks()),
  ])
  classes.value = classRows
  tasks.value = taskRows
  if (!selectedClassId.value) selectedClassId.value = classRows[0]?.class_id ?? ''
  if (!selectedTaskId.value) selectedTaskId.value = availableTasks.value[0]?.task_id ? String(availableTasks.value[0].task_id) : ''
  await loadRecords()
}

const openGrading = (sub: Submission) => {
  if (!sub.sessionId) return
  router.push({
    path: '/teacher/grading',
    query: {
      classId: selectedClassId.value,
      taskId: selectedTaskId.value,
      userId: sub.userId,
      sessionId: sub.sessionId,
    },
  })
}

watch([selectedClassId, selectedTaskId], async () => {
  if (!selectedClassId.value) return
  if (!availableTasks.value.some((task) => String(task.task_id) === String(selectedTaskId.value))) {
    selectedTaskId.value = availableTasks.value[0]?.task_id ? String(availableTasks.value[0].task_id) : ''
    return
  }
  await router.replace({ path: '/teacher/submissions', query: { classId: selectedClassId.value, taskId: selectedTaskId.value } })
  await loadRecords()
})

onMounted(() => {
  void load()
})
</script>

<template>
  <div class="p-8 flex flex-col gap-8">
    <div class="flex items-start justify-between">
      <div>
        <h2 class="text-2xl font-black text-[#1F2937] tracking-tight">{{ heading }}</h2>
        <p class="text-sm font-bold text-[#9CA3AF] mt-1">查看和批改学生的发音练习</p>
      </div>
      <select
        v-model="selectedClassId"
        class="px-4 py-2 rounded-lg border border-[#E2E8F0] bg-white text-sm font-bold text-[#475569] outline-none focus:border-[#58CC02]"
      >
        <option v-for="item in classes" :key="item.class_id" :value="item.class_id">{{ item.class_name }}</option>
      </select>
      <select
        v-model="selectedTaskId"
        class="px-4 py-2 rounded-lg border border-[#E2E8F0] bg-white text-sm font-bold text-[#475569] outline-none focus:border-[#58CC02]"
      >
        <option v-for="item in availableTasks" :key="item.task_id" :value="String(item.task_id)">{{ item.title }}</option>
      </select>
    </div>

    <ErrorState
      v-if="classesReq.error.value || tasksReq.error.value || recordsReq.error.value"
      :message="classesReq.error.value || tasksReq.error.value || recordsReq.error.value || '获取提交记录失败'"
      :busy="classesReq.loading.value || tasksReq.loading.value || recordsReq.loading.value"
      @retry="load"
    />

    <div class="flex gap-8">
      <div class="flex-1 flex flex-col gap-0">
        <div class="bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
          <div class="bg-[#F8FAFC] px-6 py-3 grid grid-cols-5 gap-4">
            <span class="text-xs font-black text-[#64748B] uppercase tracking-wider">学生</span>
            <span class="text-xs font-black text-[#64748B] uppercase tracking-wider">练习内容</span>
            <span class="text-xs font-black text-[#64748B] uppercase tracking-wider">得分</span>
            <span class="text-xs font-black text-[#64748B] uppercase tracking-wider">状态</span>
            <span class="text-xs font-black text-[#64748B] uppercase tracking-wider">提交时间</span>
          </div>

          <div v-if="recordsReq.loading.value" class="p-6">
            <SkeletonBlock class="h-12 w-full" />
          </div>

          <div v-else-if="submissions.length === 0" class="py-20 text-center">
            <div class="w-16 h-16 rounded-full bg-[#F1F5F9] mx-auto flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="1.5"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
            </div>
            <p class="text-sm font-bold text-[#9CA3AF]">暂无提交记录</p>
          </div>

          <div
            v-for="sub in submissions"
            :key="sub.id"
            class="grid grid-cols-5 gap-4 px-6 py-4 border-t border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
            @click="openGrading(sub)"
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
            <span class="text-sm text-[#9CA3AF]">{{ sub.submittedAt }}</span>
          </div>
        </div>
      </div>

      <div class="w-[290px] shrink-0 flex flex-col gap-6">
        <div class="bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6 flex flex-col gap-4" style="border-left: 4px solid #01658B;">
          <span class="text-xs font-black text-[#9CA3AF] uppercase tracking-widest">提交总数</span>
          <span class="text-3xl font-black text-[#1F2937]">{{ stats.total }}</span>
        </div>
        <div class="bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6 flex flex-col gap-4" style="border-left: 4px solid #FFB800;">
          <span class="text-xs font-black text-[#9CA3AF] uppercase tracking-widest">待批改</span>
          <span class="text-3xl font-black text-[#1F2937]">{{ stats.pending }}</span>
        </div>
        <div class="bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6 flex flex-col gap-4" style="border-left: 4px solid #356B00;">
          <span class="text-xs font-black text-[#9CA3AF] uppercase tracking-widest">已批改</span>
          <span class="text-3xl font-black text-[#1F2937]">{{ stats.graded }}</span>
        </div>
        <div class="bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6 flex flex-col gap-4" style="border-left: 4px solid #BA1A1A;">
          <span class="text-xs font-black text-[#9CA3AF] uppercase tracking-widest">平均分</span>
          <span class="text-3xl font-black text-[#1F2937]">{{ stats.avgScore.toFixed(1) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
