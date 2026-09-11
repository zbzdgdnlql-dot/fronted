<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Info, UserCheck } from 'lucide-vue-next'
import {
  assignAdminTeacherClasses,
  getAdminTeacherAssignments,
  type AdminTeacherAssignmentData,
} from '../../api/endpoints'
import { useAsync } from '../../composables/useAsync'
import { useToast } from '../../composables/useToast'
import ErrorState from '../../components/ErrorState.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const teacherId = computed(() => String(route.params.teacherId ?? ''))

const dataReq = useAsync<AdminTeacherAssignmentData>()
const detail = computed(() => dataReq.data.value)
const classes = computed(() => detail.value?.classes ?? [])

const selectedIds = ref<string[]>([])
const quickPick = ref('')
const submitting = ref(false)

const availableClasses = computed(() => classes.value.filter((item) => !item.assigned))

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
  selectedIds.value = []
  quickPick.value = ''
  await dataReq.run(async () => (await getAdminTeacherAssignments(teacherId.value)).data)
}

const toggle = (classId: string) => {
  selectedIds.value = selectedIds.value.includes(classId)
    ? selectedIds.value.filter((id) => id !== classId)
    : [...selectedIds.value, classId]
}

const onQuickPick = () => {
  if (quickPick.value && !selectedIds.value.includes(quickPick.value)) {
    selectedIds.value = [...selectedIds.value, quickPick.value]
  }
  quickPick.value = ''
}

const submit = async () => {
  if (!selectedIds.value.length) {
    toast.push('请至少选择一个班级', 'warning')
    return
  }

  submitting.value = true
  try {
    await assignAdminTeacherClasses(teacherId.value, selectedIds.value)
    toast.push('班级分配成功', 'success')
    goBack()
  } catch {
    toast.push('分配失败，请稍后重试', 'error')
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
          <h2 class="text-2xl font-black text-gray-900 tracking-tight">分配班级</h2>
          <p class="text-sm font-bold text-gray-400">为教师分配负责的教学班级</p>
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
        message="无法获取教师班级分配信息，请稍后重试。"
        :busy="dataReq.loading.value"
        @retry="load"
      />

      <template v-else-if="dataReq.loading.value">
        <SkeletonBlock class="h-32 w-full" />
        <SkeletonBlock class="h-64 w-full" />
      </template>

      <template v-else>
        <section class="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-wrap items-center gap-4">
          <span class="w-14 h-14 rounded-2xl bg-[#F4FAEE] text-[#5E9E1A] flex items-center justify-center text-xl font-black shrink-0">
            {{ (detail?.teacher_name ?? '—').charAt(0) }}
          </span>
          <div class="flex flex-col gap-1 min-w-[180px]">
            <span class="text-lg font-black text-gray-900">{{ detail?.teacher_name }}</span>
            <span class="text-xs font-bold text-gray-400">工号：{{ detail?.staff_id }}</span>
          </div>
          <div class="flex-1 flex flex-col gap-2 min-w-[220px]">
            <span class="text-xs font-black text-gray-400 uppercase tracking-widest">现有授课班级</span>
            <div v-if="classes.some((item) => item.assigned)" class="flex flex-wrap gap-2">
              <span
                v-for="item in classes.filter((c) => c.assigned)"
                :key="item.class_id"
                class="px-3 py-1 rounded-full text-xs font-black bg-[#F4FAEE] text-[#5E9E1A]"
              >
                {{ item.class_name }}
              </span>
            </div>
            <span v-else class="text-xs font-bold text-[#9CA3AF]">暂未分配班级</span>
          </div>
        </section>

        <section class="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col gap-6">
          <div>
            <label class="block mb-2 text-sm font-black text-gray-900">目标班级</label>
            <select
              v-model="quickPick"
              class="w-full px-4 py-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFB] text-sm font-bold text-[#3C3C3C] focus:outline-none focus:ring-2 focus:ring-[#70C125]/30 focus:border-[#70C125] transition"
              @change="onQuickPick"
            >
              <option value="">请选择班级</option>
              <option v-for="item in availableClasses" :key="item.class_id" :value="item.class_id">
                {{ item.class_name }}
              </option>
            </select>
          </div>

          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-black text-gray-900">可分配多个班级</span>
              <span class="text-xs font-bold text-gray-400">已选 {{ selectedIds.length }} 个</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                v-for="item in classes"
                :key="item.class_id"
                class="flex items-center gap-3 rounded-2xl border-2 px-4 py-3 transition-colors"
                :class="
                  item.assigned
                    ? 'border-[#EAF0DD] bg-[#F4FAEE] cursor-not-allowed'
                    : selectedIds.includes(item.class_id)
                      ? 'border-[#70C125] bg-[#F4FAEE] cursor-pointer'
                      : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFB] cursor-pointer'
                "
              >
                <input
                  type="checkbox"
                  class="w-4 h-4 accent-[#70C125]"
                  :checked="item.assigned || selectedIds.includes(item.class_id)"
                  :disabled="item.assigned"
                  @change="toggle(item.class_id)"
                />
                <span class="flex-1 min-w-0">
                  <span class="block text-sm font-black text-gray-900 truncate">{{ item.class_name }}</span>
                  <span class="mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-black" :class="languageStyle(item.language)">
                    {{ item.language }}
                  </span>
                </span>
                <span v-if="item.assigned" class="text-xs font-black text-[#5E9E1A] shrink-0">已分配</span>
              </label>
            </div>
          </div>

          <div class="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#F0F9FF] text-[#1899D6]">
            <Info class="w-5 h-5 shrink-0" />
            <span class="text-sm font-bold">教师分配班级后即可在班级列表显示为任课教师。</span>
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
              class="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-[#70C125] text-white text-sm font-black border-b-4 border-[#5E9E1A] hover:brightness-105 active:border-b-2 active:translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              @click="submit"
            >
              <UserCheck class="w-5 h-5" />
              <span>{{ submitting ? '提交中…' : '确认分配' }}</span>
            </button>
          </div>
        </section>
      </template>
    </div>
  </main>
</template>
