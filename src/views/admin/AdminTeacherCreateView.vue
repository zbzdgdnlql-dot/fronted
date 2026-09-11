<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Info, Check } from 'lucide-vue-next'
import { saveAdminTeacher } from '../../api/endpoints'
import { useToast } from '../../composables/useToast'

const router = useRouter()
const toast = useToast()

const submitting = ref(false)

const form = reactive({
  name: '',
  staff_id: '',
  password: '',
})

const inputClass =
  'w-full px-4 py-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFB] text-sm font-bold text-[#3C3C3C] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#70C125]/30 focus:border-[#70C125] transition'

const goBack = () => router.push('/admin/teachers')

const submit = async () => {
  if (!form.name.trim()) {
    toast.push('请输入教师姓名', 'warning')
    return
  }
  if (!form.staff_id.trim()) {
    toast.push('请输入教师工号', 'warning')
    return
  }
  if (!form.password) {
    toast.push('请输入初始密码', 'warning')
    return
  }

  submitting.value = true
  try {
    await saveAdminTeacher({
      name: form.name.trim(),
      staff_id: form.staff_id.trim(),
      password: form.password,
    })
    toast.push('教师创建成功', 'success')
    goBack()
  } catch {
    toast.push('创建失败，请稍后重试', 'error')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="flex-1 w-full p-8">
    <div class="max-w-2xl mx-auto flex flex-col gap-6">
      <div class="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#F4FAEE] text-[#5E9E1A]">
        <Info class="w-5 h-5 shrink-0" />
        <span class="text-sm font-bold">创建后可继续为教师分配班级</span>
      </div>

      <section class="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
        <div class="mb-8">
          <h1 class="text-2xl font-black text-gray-900">创建新教师</h1>
          <p class="mt-2 text-sm font-bold text-gray-400">新增一位教师账号并为其分配任教班级</p>
        </div>

        <form class="flex flex-col gap-6" @submit.prevent="submit">
          <div>
            <label class="block mb-2 text-sm font-black text-gray-900">教师姓名</label>
            <input v-model="form.name" type="text" placeholder="请输入教师姓名" :class="inputClass" />
          </div>

          <div>
            <label class="block mb-2 text-sm font-black text-gray-900">教师工号</label>
            <input v-model="form.staff_id" type="text" placeholder="如 T-1007" :class="inputClass" />
          </div>

          <div>
            <label class="block mb-2 text-sm font-black text-gray-900">初始密码</label>
            <input v-model="form.password" type="password" placeholder="请输入初始密码" :class="inputClass" />
            <p class="mt-2 text-xs font-bold text-[#9CA3AF]">
              邮箱由用户登录后自行设置，用于重置密码
            </p>
          </div>

          <div class="mt-2 flex items-center justify-between gap-4">
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
              <Check class="w-5 h-5" />
              <span>{{ submitting ? '保存中…' : '保存并创建' }}</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  </main>
</template>
