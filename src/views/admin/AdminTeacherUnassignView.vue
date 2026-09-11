<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AlertTriangle, ArrowLeft, BadgeCheck, LogOut, X } from 'lucide-vue-next'
import {
  getAdminTeacherAssignments,
  unassignAdminTeacherClasses,
  type AdminTeacherAssignmentData,
} from '../../api/endpoints'
import { useAsync } from '../../composables/useAsync'
import { useToast } from '../../composables/useToast'
import ErrorState from '../../components/ErrorState.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import EmptyState from '../../components/EmptyState.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const teacherId = computed(() => String(route.params.teacherId ?? ''))

const dataReq = useAsync<AdminTeacherAssignmentData>()
const detail = computed(() => dataReq.data.value)
const assignedClasses = computed(() => (detail.value?.classes ?? []).filter((item) => item.assigned))

const selectedIds = ref<string[]>([])
const submitting = ref(false)

const languageStyles: Record<string, string> = {
  日语: 'bg-[#FFF0F9] text-[#CF3EA5]',
  德语: 'bg-[#F3F4F6] text-[#6B7280]',
  法语: 'bg-[#FFF9E6] text-[#CA8A04]',
  西班牙语: 'bg-[#EEF2FF] text-[#4F46E5]',
  俄语: 'bg-[#F4FAEE] text-[#5E9E1A]',
}
const languageStyle = (language: string) => languageStyles[language] ?? 'bg-[#F1F5F9] text-[#6B7280]'

const goBack = () => router.push('/admin/teachers')

const load = async () => {
  await dataReq.run(async () => {
    const data = (await getAdminTeacherAssignments(teacherId.value)).data
    selectedIds.value = data.classes.filter((item) => item.assigned).map((item) => item.class_id)
    return data
  })
}

const toggle = (classId: string) => {
  selectedIds.value = selectedIds.value.includes(classId)
    ? selectedIds.value.filter((id) => id !== classId)
    : [...selectedIds.value, classId]
}

const submit = async () => {
  if (!selectedIds.value.length) {
    toast.push('请至少选择一个要解除的班级', 'warning')
    return
  }

  submitting.value = true
  try {
    await unassignAdminTeacherClasses(teacherId.value, selectedIds.value)
    toast.push('已解除班级分配', 'success')
    goBack()
  } catch {
    toast.push('操作失败，请稍后重试', 'error')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  void load()
})
</script>

<template>
  <main class="flex-1 w-full p-8">
    <div class="max-w-3xl mx-auto flex flex-col gap-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-col gap-2">
          <h2 class="text-2xl font-black text-gray-900 tracking-tight">解除班级分配</h2>
          <p class="text-sm font-bold text-gray-400">将教师从教学班级中移除，保留其档案与历史记录</p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-[#E2E8F0] bg-white text-[#6B7280] text-sm font-black hover:bg-[#F8FAFB] transition-colors"
          @click="goBack"
        >
          <ArrowLeft class="w-4 h-4" />
          返回教师列表
        </button>
      </div>

      <ErrorState
        v-if="dataReq.error.value"
        title="加载失败"
        message="无法获取教师班级信息，请稍后重试。"
        :busy="dataReq.loading.value"
        @retry="load"
      />

      <template v-else-if="dataReq.loading.value">
        <SkeletonBlock class="h-28 w-full" />
        <SkeletonBlock class="h-64 w-full" />
      </template>

      <template v-else>
        <section class="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-wrap items-center gap-4">
          <span class="w-14 h-14 rounded-2xl bg-[#1CB0F6] text-white flex items-center justify-center text-xl font-black shrink-0">
            {{ (detail?.teacher_name ?? '—').charAt(0) }}
          </span>
          <div class="flex flex-col gap-1 min-w-[180px]">
            <span class="text-lg font-black text-gray-900">{{ detail?.teacher_name }}</span>
            <span class="inline-flex items-center gap-1 text-xs font-bold text-gray-400">
              <BadgeCheck class="w-3.5 h-3.5" />
              工号 {{ detail?.staff_id }}
            </span>
          </div>
        </section>

        <EmptyState
          v-if="!assignedClasses.length"
          title="暂无可解除的班级"
          description="该教师当前没有已分配的班级，无需解除分配。"
        />

        <section v-else class="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col gap-6">
          <div class="flex items-center justify-between gap-4">
            <div class="flex flex-col gap-1">
              <span class="text-sm font-black text-gray-900">已授班级</span>
              <span class="text-xs font-bold text-gray-400">勾选要解除分配的班级</span>
            </div>
            <span class="px-3 py-1 rounded-full text-xs font-black bg-[#F1F5F9] text-[#6B7280]">
              共 {{ assignedClasses.length }} 个班级
            </span>
          </div>

          <div class="flex flex-col gap-3">
            <div
              v-for="item in assignedClasses"
              :key="item.class_id"
              class="flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-colors"
              :class="
                selectedIds.includes(item.class_id)
                  ? 'border-[#FDE68A] bg-[#FFFBEB]'
                  : 'border-[#E2E8F0] bg-white'
              "
            >
              <input
                type="checkbox"
                class="w-4 h-4 accent-[#EF4444]"
                :checked="selectedIds.includes(item.class_id)"
                @change="toggle(item.class_id)"
              />
              <span class="flex-1 min-w-[140px] text-sm font-black text-gray-900 truncate">{{ item.class_name }}</span>
              <span class="px-3 py-1 rounded-full text-xs font-black" :class="languageStyle(item.language)">
                {{ item.language }}
              </span>
              <button
                type="button"
                class="inline-flex items-center gap-1 px-3 py-1.5 rounded-2xl text-xs font-black text-[#EF4444] hover:bg-[#FEF2F2] transition-colors"
                @click="toggle(item.class_id)"
              >
                <X class="w-3.5 h-3.5" />
                移除
              </button>
            </div>
          </div>

          <div class="flex items-start gap-3 px-4 py-3 rounded-2xl bg-[#FEF9C3] border-2 border-[#FDE68A] text-[#854D0E]">
            <AlertTriangle class="w-5 h-5 shrink-0" />
            <span class="text-sm font-bold">解除分配后，班级任课教师将显示为空，需重新分配。</span>
          </div>

          <div class="flex items-center justify-end gap-3">
            <button
              type="button"
              class="px-6 py-3 rounded-2xl border-2 border-[#E2E8F0] bg-white text-[#6B7280] text-sm font-black hover:bg-[#F8FAFB] transition-colors"
              @click="goBack"
            >
              取消
            </button>
            <button
              type="button"
              :disabled="submitting"
              class="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-[#EF4444] text-white text-sm font-black border-b-4 border-[#C0263E] hover:brightness-105 active:border-b-2 active:translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              @click="submit"
            >
              <LogOut class="w-5 h-5" />
              <span>{{ submitting ? '处理中…' : '确认解除' }}</span>
            </button>
          </div>
        </section>
      </template>
    </div>
  </main>
</template>
