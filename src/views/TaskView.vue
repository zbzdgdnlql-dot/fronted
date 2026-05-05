<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import TaskSidebar from './tasks/TaskSidebar.vue'
import TaskMain from './tasks/TaskMain.vue'
import ErrorState from '../components/ErrorState.vue'
import { getStudentCustomContentRecords, getStudentCustomContents, type StudentContentRecordItem, type StudentCustomContentItem } from '../api/endpoints'
import { useAsync } from '../composables/useAsync'
import { useToast } from '../composables/useToast'

const toast = useToast()
const listReq = useAsync<{ class_content: StudentCustomContentItem[] }>()
const recordsReq = useAsync<{ class_content: StudentContentRecordItem[] }>()

const selectedContentId = ref<string | null>(null)

const items = computed(() => listReq.data.value?.class_content ?? [])
const records = computed(() => recordsReq.data.value?.class_content ?? [])

const loadList = async () => {
  await listReq.run(async () => {
    const res = await getStudentCustomContents()
    return res
  })
  if (!selectedContentId.value && items.value.length) selectedContentId.value = items.value[0].content_id
}

const loadRecords = async () => {
  if (!selectedContentId.value) return
  await recordsReq.run(async () => {
    const res = await getStudentCustomContentRecords(selectedContentId.value!)
    return res
  })
}

const select = async (contentId: string) => {
  selectedContentId.value = contentId
  try {
    await loadRecords()
  } catch {
    toast.push('获取记录失败，可点击重试', 'error')
  }
}

onMounted(async () => {
  try {
    await loadList()
    await loadRecords()
  } catch {
    toast.push('获取任务列表失败，可点击重试', 'error')
  }
})
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
        :items="items"
        :loading="listReq.loading.value"
        :selected-content-id="selectedContentId"
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
        :records="records"
      />
      <!-- TODO: 接入记录详情：/student/custom_content/detail/<session_id> 与 /student/custom_content/problem_areas/<session_id>，并支持跳转到结果页展示单句评分与薄弱点。 -->
    </div>
  </main>
</template>
