<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import TaskSidebar from './tasks/TaskSidebar.vue'
import TaskMain from './tasks/TaskMain.vue'
import ErrorState from '../components/ErrorState.vue'
import {
  getStudentSessionDetails,
  getStudentTaskDetail,
  getStudentTaskRecords,
  getStudentTasks,
  type StudentSessionEvaluationItem,
  type StudentTaskDetail,
  type StudentTaskItem,
  type StudentTaskRecordItem,
} from '../api/endpoints'
import { useAsync } from '../composables/useAsync'
import { useToast } from '../composables/useToast'
import { useAuth } from '../stores/auth'

const toast = useToast()
const auth = useAuth()
const router = useRouter()
const listReq = useAsync<{ ok: boolean; data: StudentTaskItem[] }>()
const taskDetailReq = useAsync<{ ok: boolean; data: StudentTaskDetail }>()
const recordsReq = useAsync<{ tasks: StudentTaskRecordItem[] }>()
const detailsReq = useAsync<{ success: boolean; details: StudentSessionEvaluationItem[] }>()

const selectedTaskId = ref<string | null>(null)
const selectedSessionId = ref<string | null>(null)

const currentClassId = computed(() => auth.session.value?.class_context?.class_id ?? null)
const items = computed(() => listReq.data.value?.data ?? [])
const selectedTaskDetail = computed(() => taskDetailReq.data.value?.data ?? null)
const displayItems = computed(() => {
  const detail = selectedTaskDetail.value
  if (!detail) return items.value
  return items.value.map((item) => {
    if (String(item.task_id) !== String(detail.task_id)) return item
    return {
      ...item,
      is_active: detail.is_active,
      available_from: detail.available_from,
      available_until: detail.available_until,
    }
  })
})
const records = computed(() => recordsReq.data.value?.tasks ?? [])
const details = computed(() => detailsReq.data.value?.details ?? [])

const loadList = async () => {
  if (!currentClassId.value) {
    listReq.data.value = { ok: true, data: [] }
    selectedTaskId.value = null
    return
  }
  await listReq.run(async () => {
    const res = await getStudentTasks(currentClassId.value)
    return res
  })
  selectedTaskId.value = items.value[0]?.task_id ?? null
}

const loadRecords = async () => {
  if (!selectedTaskId.value) return
  await taskDetailReq.run(() => getStudentTaskDetail(selectedTaskId.value!))
  await recordsReq.run(async () => {
    const res = await getStudentTaskRecords(selectedTaskId.value!)
    return res
  })
  selectedSessionId.value = records.value[0]?.session_id ?? null
  detailsReq.data.value = null
  if (selectedSessionId.value) await loadSessionDetails(selectedSessionId.value)
}

const select = async (taskId: string) => {
  selectedTaskId.value = taskId
  try {
    await loadRecords()
  } catch {
    toast.push('获取记录失败，可点击重试', 'error')
  }
}

const loadSessionDetails = async (sessionId = selectedSessionId.value) => {
  if (!sessionId) return
  selectedSessionId.value = sessionId
  try {
    await detailsReq.run(() => getStudentSessionDetails(sessionId))
  } catch {
    toast.push('获取句子明细失败，可点击重试', 'error')
  }
}

const startTest = async (taskId: number) => {
  await router.push({ name: 'task-test', params: { taskId: String(taskId) } })
}

watch(currentClassId, async () => {
  selectedSessionId.value = null
  taskDetailReq.data.value = null
  recordsReq.data.value = null
  detailsReq.data.value = null
  try {
    await loadList()
    await loadRecords()
  } catch {
    toast.push('获取任务列表失败，可点击重试', 'error')
  }
}, { immediate: true })
</script>

<template>
  <main class="flex-1 w-full max-w-[1440px] mx-auto p-8 flex flex-col xl:flex-row gap-8">
    <div class="w-full xl:w-[320px] shrink-0">
      <ErrorState
        v-if="listReq.error.value"
        message="无法获取班级内容，请检查网络或登录状态。"
        :busy="listReq.loading.value"
        @retry="loadList"
      />
      <TaskSidebar
        v-else
        :items="displayItems"
        :loading="listReq.loading.value"
        :selected-task-id="selectedTaskId"
        @select="select"
      />
    </div>
    <div class="flex-1">
      <ErrorState
        v-if="recordsReq.error.value"
        message="无法获取练习记录，请稍后重试。"
        :busy="recordsReq.loading.value"
        @retry="loadRecords"
      />
      <TaskMain
        v-else
        :loading="recordsReq.loading.value"
        :task-detail="selectedTaskDetail"
        :task-detail-loading="taskDetailReq.loading.value"
        :task-detail-error="taskDetailReq.error.value"
        :records="records"
        :selected-session-id="selectedSessionId"
        :details="details"
        :details-loading="detailsReq.loading.value"
        :details-error="detailsReq.error.value"
        @select-record="loadSessionDetails"
        @start-test="startTest"
      />
    </div>
  </main>
</template>
