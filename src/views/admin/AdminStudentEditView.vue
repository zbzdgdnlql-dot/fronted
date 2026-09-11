<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Save } from 'lucide-vue-next'
import { getAdminStudentDetail, saveAdminStudent, type AdminStudentItem } from '../../api/endpoints'
import { useAsync } from '../../composables/useAsync'
import { useToast } from '../../composables/useToast'
import ErrorState from '../../components/ErrorState.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const userId = computed(() => String(route.params.userId ?? ''))

const detailReq = useAsync<AdminStudentItem>()

const submitting = ref(false)

const form = reactive({
  name: '',
  stu_id: '',
})

const inputClass =
  'w-full px-4 py-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFB] text-sm font-bold text-[#3C3C3C] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#70C125]/30 focus:border-[#70C125] transition'

const readonlyClass =
  'w-full px-4 py-3 rounded-2xl border border-[#E2E8F0] bg-[#F1F5F9] text-sm font-bold text-[#9CA3AF] cursor-not-allowed'

const goBack = () => router.push('/admin/students')

const load = async () => {
  await detailReq.run(async () => {
    const data = (await getAdminStudentDetail(userId.value)).data
    form.name = data.name
    form.stu_id = data.stu_id
    return data
  })
}

const submit = async () => {
  if (!form.name.trim()) {
    toast.push('请输入学生姓名', 'warning')
    return
  }

  submitting.value = true
  try {
    await saveAdminStudent({
      user_id: userId.value,
      name: form.name.trim(),
      stu_id: form.stu_id,
    })
    toast.push('学生信息已更新', 'success')
    goBack()
  } catch {
    toast.push('保存失败，请稍后重试', 'error')
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
    <div class="max-w-2xl mx-auto flex flex-col gap-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-col gap-2">
          <h2 class="text-2xl font-black text-gray-900 tracking-tight">编辑学生信息</h2>
          <p class="text-sm font-bold text-gray-400">修改学生姓名或学号</p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-[#E2E8F0] bg-white text-[#6B7280] text-sm font-black hover:bg-[#F8FAFB] transition-colors"
          @click="goBack"
        >
          <ArrowLeft class="w-4 h-4" />
          返回学生列表
        </button>
      </div>

      <ErrorState
        v-if="detailReq.error.value"
        title="加载失败"
        message="无法获取学生信息，请稍后重试。"
        :busy="detailReq.loading.value"
        @retry="load"
      />

      <section v-else-if="detailReq.loading.value" class="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
        <SkeletonBlock class="h-10 w-full mb-6" />
        <SkeletonBlock class="h-10 w-full" />
      </section>

      <section v-else class="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
        <form class="flex flex-col gap-6" @submit.prevent="submit">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label class="block mb-2 text-sm font-black text-gray-900">学生姓名</label>
              <input v-model="form.name" type="text" placeholder="请输入学生姓名" :class="inputClass" />
            </div>
            <div>
              <label class="block mb-2 text-sm font-black text-gray-900">学号</label>
              <input :value="form.stu_id" type="text" readonly :class="readonlyClass" />
            </div>
          </div>

          <div class="mt-2 flex items-center justify-end gap-3 border-t border-gray-100 pt-6">
            <button
              type="button"
              class="px-6 py-3 rounded-2xl border-2 border-[#E2E8F0] bg-white text-[#6B7280] text-sm font-black hover:bg-[#F8FAFB] transition-colors"
              @click="goBack"
            >
              取消
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-[#70C125] text-white text-sm font-black border-b-4 border-[#5E9E1A] hover:brightness-105 active:border-b-2 active:translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Save class="w-5 h-5" />
              <span>{{ submitting ? '保存中…' : '保存修改' }}</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  </main>
</template>
