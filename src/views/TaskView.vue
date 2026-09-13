<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import TaskSidebar from './tasks/TaskSidebar.vue'
import TaskMain from './tasks/TaskMain.vue'
import ErrorState from '../components/ErrorState.vue'
import {
  getStudentTaskDetail,
  getStudentTaskRecords,
  getStudentTasks,
  type StudentTaskDetail,
  type StudentTaskItem,
} from '../api/endpoints'
import { useAsync } from '../composables/useAsync'
import { useToast } from '../composables/useToast'
import { useAuth } from '../stores/auth'

const toast = useToast()
const auth = useAuth()
const router = useRouter()
const listReq = useAsync<{ ok: boolean; data: StudentTaskItem[] }>()
const taskDetailReq = useAsync<{ ok: boolean; data: StudentTaskDetail }>()

const selectedTaskId = ref<string | null>(null)
const attemptCounts = ref<Record<string, number>>({})
// 列表接口不返回 available_until，这里逐个任务补齐，供左侧列表展示与排序
const taskDeadlines = ref<Record<string, string | null>>({})

const currentClassId = computed(() => auth.session.value?.class_context?.class_id ?? null)
const items = computed(() => listReq.data.value?.data ?? [])
const selectedTaskDetail = computed(() => taskDetailReq.data.value?.data ?? null)
const displayItems = computed(() => {
  const detail = selectedTaskDetail.value
  return items.value.map((item) => {
    const itemTaskId = String(item.task_id)
    const attemptCount = attemptCounts.value[itemTaskId] ?? item.attempt_count ?? 0
    const base = {
      ...item,
      attempt_count: attemptCount,
      available_until: taskDeadlines.value[itemTaskId] ?? item.available_until ?? null,
    }
    if (!detail || itemTaskId !== String(detail.task_id)) return base
    return {
      ...base,
      is_active: detail.is_active,
      available_from: detail.available_from,
      available_until: detail.available_until ?? base.available_until,
    }
  })
})
const selectedAttemptCount = computed(() => {
  if (!selectedTaskId.value) return 0
  return attemptCounts.value[selectedTaskId.value] ?? 0
})

const loadList = async () => {
  if (!currentClassId.value) {
    listReq.data.value = { ok: true, data: [] }
    selectedTaskId.value = null
    attemptCounts.value = {}
    taskDeadlines.value = {}
    return
  }
  await listReq.run(async () => {
    const res = await getStudentTasks(currentClassId.value)
    return res
  })
  await loadTaskMeta()
  // 默认选中左侧列表排序后的第一条（未完成且截止最近），避免选中项被挤到可视区之外
  const first =
    items.value.find((item) => (attemptCounts.value[item.task_id] ?? 0) < 1) ?? items.value[0]
  selectedTaskId.value = first?.task_id ?? null
}

/** 并发补齐每个任务的尝试次数与截止时间（列表接口不提供，用于排序与展示） */
const loadTaskMeta = async () => {
  const taskItems = items.value
  if (!taskItems.length) {
    attemptCounts.value = {}
    taskDeadlines.value = {}
    return
  }
  const entries = await Promise.all(taskItems.map(async (item) => {
    const taskId = String(item.task_id)
    const countPromise = getStudentTaskRecords(item.task_id)
      .then((res) => res.tasks.length)
      .catch(() => item.attempt_count ?? 0)
    let availableUntil = item.available_until ?? null
    if (!availableUntil) {
      const detail = await getStudentTaskDetail(item.task_id).catch(() => null)
      availableUntil = detail?.data.available_until ?? null
    }
    return { taskId, attemptCount: await countPromise, availableUntil } as const
  }))
  attemptCounts.value = Object.fromEntries(entries.map((entry) => [entry.taskId, entry.attemptCount]))
  taskDeadlines.value = Object.fromEntries(entries.map((entry) => [entry.taskId, entry.availableUntil]))
}

const loadDetail = async () => {
  if (!selectedTaskId.value) return
  await taskDetailReq.run(() => getStudentTaskDetail(selectedTaskId.value!))
}

const select = async (taskId: string) => {
  selectedTaskId.value = taskId
  try {
    await loadDetail()
  } catch {
    toast.push('获取任务详情失败，可点击重试', 'error')
  }
}

const startTest = async (taskId: string) => {
  await router.push({ name: 'task-test', params: { taskId: String(taskId) } })
}

watch(currentClassId, async () => {
  taskDetailReq.data.value = null
  attemptCounts.value = {}
  taskDeadlines.value = {}
  try {
    await loadList()
    await loadDetail()
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
        v-if="taskDetailReq.error.value"
        message="无法获取任务详情，请稍后重试。"
        :busy="taskDetailReq.loading.value"
        @retry="loadDetail"
      />
      <TaskMain
        v-else
        :task-detail="selectedTaskDetail"
        :selected-task-id="selectedTaskId"
        :task-detail-loading="taskDetailReq.loading.value"
        :task-detail-error="taskDetailReq.error.value"
        :attempt-count="selectedAttemptCount"
        @start-test="startTest"
      />
    </div>
  </main>
</template>
