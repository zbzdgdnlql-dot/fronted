<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Info, FileSpreadsheet, Check } from 'lucide-vue-next'
import { ADMIN_LANGUAGE_OPTIONS, getAdminTeachers, saveAdminClass, type AdminTeacherItem } from '../../api/endpoints'
import { useToast } from '../../composables/useToast'

const router = useRouter()
const toast = useToast()

const languages = ADMIN_LANGUAGE_OPTIONS

const teachers = ref<AdminTeacherItem[]>([])
const submitting = ref(false)
const rawStudents = ref('')

const form = reactive({
  class_name: '',
  language: '',
  teacher_id: '',
  start_date: '',
  capacity: '',
})

const inputClass =
  'w-full px-4 py-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFB] text-sm font-bold text-[#3C3C3C] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#70C125]/30 focus:border-[#70C125] transition'

const fillSample = () => {
  rawStudents.value = ['S1001,王小明', 'S1002,李华', 'S1003,张伟'].join('\n')
}

const parseStudents = () =>
  rawStudents.value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [stu_id = '', name = ''] = line.split(/[,，\t]/).map((part) => part.trim())
      return { stu_id, name }
    })
    .filter((item) => item.stu_id && item.name)

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
      class_name: form.class_name.trim(),
      language: form.language,
      teacher_id: form.teacher_id || null,
      start_date: form.start_date || null,
      capacity: form.capacity ? Number(form.capacity) : null,
      students: parseStudents(),
    })
    toast.push('班级创建成功', 'success')
    router.push('/admin/classes')
  } catch {
    toast.push('创建失败，请稍后重试', 'error')
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
})
</script>

<template>
  <main class="flex-1 w-full p-8">
    <div class="max-w-2xl mx-auto flex flex-col gap-6">
      <div class="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#F4FAEE] text-[#5E9E1A]">
        <Info class="w-5 h-5 shrink-0" />
        <span class="text-sm font-bold">班级创建后可继续添加学生或编辑班级信息</span>
      </div>

      <section class="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
        <div class="mb-8">
          <h1 class="text-2xl font-black text-gray-900">创建新班级</h1>
          <p class="mt-2 text-sm font-bold text-gray-400">创建班级并批量导入学生，助力快速开班</p>
        </div>

        <form class="flex flex-col gap-6" @submit.prevent="submit">
          <div>
            <label class="block mb-2 text-sm font-black text-gray-900">班级名称</label>
            <input v-model="form.class_name" type="text" placeholder="如 英语初级班-A" :class="inputClass" />
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
              <option value="">请选择任课教师</option>
              <option v-for="teacher in teachers" :key="teacher.teacher_id" :value="teacher.teacher_id">
                {{ teacher.name }}
              </option>
            </select>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label class="block mb-2 text-sm font-black text-gray-900">开班日期</label>
              <input v-model="form.start_date" type="date" :class="inputClass" />
            </div>
            <div>
              <label class="block mb-2 text-sm font-black text-gray-900">班级容量</label>
              <input v-model="form.capacity" type="number" min="1" placeholder="如 30" :class="inputClass" />
            </div>
          </div>

          <div>
            <div class="mb-2 flex items-center justify-between">
              <label class="text-sm font-black text-gray-900">批量导入学生</label>
              <button
                type="button"
                class="px-3 py-1.5 rounded-2xl bg-[#F4FAEE] text-[#5E9E1A] text-xs font-black hover:bg-[#EAF0DD] transition-colors"
                @click="fillSample"
              >
                导入示例
              </button>
            </div>
            <div class="bg-[#F8FAFB] border-2 border-dashed border-[#E2E8F0] rounded-2xl p-5">
              <div class="flex items-center gap-3 mb-3">
                <FileSpreadsheet class="w-5 h-5 text-[#9CA3AF]" />
                <span class="text-sm font-bold text-[#6B7280]">粘贴学号/姓名表格文本，或直接粘贴表格</span>
              </div>
              <textarea
                v-model="rawStudents"
                rows="6"
                placeholder="每行一名学生，格式：学号,姓名"
                class="w-full px-4 py-3 rounded-2xl border border-[#E2E8F0] bg-white text-sm font-bold text-[#3C3C3C] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#70C125]/30 focus:border-[#70C125] transition resize-y"
              />
              <div class="mt-3 px-4 py-2 rounded-xl bg-[#F1F5F9] text-xs font-bold text-[#6B7280]">
                示例：S1001,王小明
              </div>
            </div>
          </div>

          <div class="mt-2 flex items-center justify-between gap-4">
            <button
              type="button"
              class="px-6 py-3 rounded-2xl border-2 border-[#E2E8F0] bg-white text-[#6B7280] text-sm font-black hover:bg-[#F8FAFB] transition-colors"
              @click="router.push('/admin/classes')"
            >
              取消
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-[#70C125] text-white text-sm font-black border-b-4 border-[#5E9E1A] hover:brightness-105 active:border-b-2 active:translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Check class="w-5 h-5" />
              <span>{{ submitting ? '保存中…' : '保存并创建' }}</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  </main>
</template>
