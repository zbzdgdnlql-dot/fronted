<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Check, X } from 'lucide-vue-next'
import {
  ADMIN_LANGUAGE_OPTIONS,
  getAdminClassDetail,
  getAdminTeachers,
  saveAdminClass,
  type AdminClassItem,
  type AdminClassStatus,
  type AdminTeacherItem,
} from '../../api/endpoints'
import { useAsync } from '../../composables/useAsync'
import { useToast } from '../../composables/useToast'
import ErrorState from '../../components/ErrorState.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const classId = computed(() => String(route.params.classId ?? ''))

const detailReq = useAsync<AdminClassItem>()

const teachers = ref<AdminTeacherItem[]>([])
const submitting = ref(false)

const languages = ADMIN_LANGUAGE_OPTIONS

const form = reactive({
  class_name: '',
  language: '',
  teacher_id: '',
  status: 'active' as AdminClassStatus,
  description: '',
})

const inputClass =
  'w-full px-4 py-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFB] text-sm font-bold text-[#3C3C3C] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#70C125]/30 focus:border-[#70C125] transition'

const statusOptions: Array<{ value: AdminClassStatus; label: string; hint: string }> = [
  { value: 'active', label: '进行中', hint: '学生可正常参与学习' },
  { value: 'ended', label: '已结课', hint: '班级归档，不再接收新学生' },
]

const goBack = () => router.push('/admin/classes')

const load = async () => {
  await detailReq.run(async () => {
    const data = (await getAdminClassDetail(classId.value)).data
    form.class_name = data.class_name
    form.language = data.language
    form.teacher_id = data.teacher_id ?? ''
    form.status = data.status
    form.description = data.description ?? ''
    return data
  })
}

const submit = async () => {
  if (!form.class_name.trim()) {
    toast.push('请输入班级名称', 'warning')
    return
  }
  if (!form.language) {
    toast.push('请选择授课语言', 'warning')
    return
  }

  submitting.value = true
  try {
    await saveAdminClass({
      class_id: classId.value,
      class_name: form.class_name.trim(),
      language: form.language,
      teacher_id: form.teacher_id || null,
      status: form.status,
      description: form.description.trim() || null,
    })
    toast.push('班级信息已更新', 'success')
    goBack()
  } catch {
    toast.push('保存失败，请稍后重试', 'error')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    teachers.value = (await getAdminTeachers()).data
  } catch {
    teachers.value = []
  }
  await load()
})
</script>

<template>
  <main class="flex-1 w-full p-8">
    <div class="max-w-3xl mx-auto flex flex-col gap-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-col gap-2">
          <h2 class="text-2xl font-black text-gray-900 tracking-tight">编辑班级信息</h2>
          <p class="text-sm font-bold text-gray-400">修改班级名称、授课语言、任课教师与状态</p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-[#E2E8F0] bg-white text-[#6B7280] text-sm font-black hover:bg-[#F8FAFB] transition-colors"
          @click="goBack"
        >
          <ArrowLeft class="w-4 h-4" />
          返回班级列表
        </button>
      </div>

      <ErrorState
        v-if="detailReq.error.value"
        title="加载失败"
        message="无法获取班级信息，请稍后重试。"
        :busy="detailReq.loading.value"
        @retry="load"
      />

      <section v-else-if="detailReq.loading.value" class="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
        <SkeletonBlock class="h-10 w-full mb-6" />
        <SkeletonBlock class="h-10 w-full mb-6" />
        <SkeletonBlock class="h-10 w-full" />
      </section>

      <section v-else class="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
        <form class="flex flex-col gap-6" @submit.prevent="submit">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label class="block mb-2 text-sm font-black text-gray-900">班级名称</label>
              <input v-model="form.class_name" type="text" :class="inputClass" />
            </div>

            <div>
              <label class="block mb-2 text-sm font-black text-gray-900">授课语言</label>
              <select v-model="form.language" :class="inputClass">
                <option value="">请选择授课语言</option>
                <option v-for="item in languages" :key="item" :value="item">{{ item }}</option>
              </select>
            </div>

            <div>
              <label class="block mb-2 text-sm font-black text-gray-900">任课教师</label>
              <select v-model="form.teacher_id" :class="inputClass">
                <option value="">暂不分配</option>
                <option v-for="teacher in teachers" :key="teacher.teacher_id" :value="teacher.teacher_id">
                  {{ teacher.name }}
                </option>
              </select>
            </div>

            <div>
              <span class="block mb-2 text-sm font-black text-gray-900">班级状态</span>
              <div class="flex flex-wrap gap-3">
                <label
                  v-for="option in statusOptions"
                  :key="option.value"
                  class="flex-1 min-w-[140px] cursor-pointer rounded-2xl border-2 px-4 py-3 transition-colors"
                  :class="
                    form.status === option.value
                      ? 'border-[#70C125] bg-[#F4FAEE] text-[#5E9E1A]'
                      : 'border-[#E2E8F0] bg-white text-[#6B7280] hover:bg-[#F8FAFB]'
                  "
                >
                  <input v-model="form.status" type="radio" :value="option.value" class="sr-only" />
                  <span class="block text-sm font-black">{{ option.label }}</span>
                  <span class="mt-1 block text-xs font-bold opacity-80">{{ option.hint }}</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label class="block mb-2 text-sm font-black text-gray-900">班级描述</label>
            <textarea
              v-model="form.description"
              rows="4"
              placeholder="补充班级的教学目标、上课时间等信息"
              class="w-full px-4 py-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFB] text-sm font-bold text-[#3C3C3C] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#70C125]/30 focus:border-[#70C125] transition resize-y"
            />
          </div>

          <div class="mt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              class="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border-2 border-[#E2E8F0] bg-white text-[#6B7280] text-sm font-black hover:bg-[#F8FAFB] transition-colors"
              @click="goBack"
            >
              <X class="w-4 h-4" />
              取消
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-[#70C125] text-white text-sm font-black border-b-4 border-[#5E9E1A] hover:brightness-105 active:border-b-2 active:translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Check class="w-5 h-5" />
              <span>{{ submitting ? '保存中…' : '保存修改' }}</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  </main>
</template>
