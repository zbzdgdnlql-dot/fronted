<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, School, UserPlus } from 'lucide-vue-next'
import { getAdminClassDetail, saveAdminStudent, type AdminClassItem } from '../../api/endpoints'
import { useAsync } from '../../composables/useAsync'
import { useToast } from '../../composables/useToast'
import ErrorState from '../../components/ErrorState.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const classId = computed(() => String(route.params.classId ?? ''))

const detailReq = useAsync<AdminClassItem>()
const detail = computed(() => detailReq.data.value)

const submitting = ref(false)

const form = reactive({
  name: '',
  stu_id: '',
  password: '',
})

const inputClass =
  'w-full px-4 py-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFB] text-sm font-bold text-[#3C3C3C] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#70C125]/30 focus:border-[#70C125] transition'

const goBack = () => router.push(`/admin/students?class_id=${classId.value}`)

const load = async () => {
  await detailReq.run(async () => (await getAdminClassDetail(classId.value)).data)
}

const submit = async () => {
  if (!form.name.trim()) {
    toast.push('请输入学生姓名', 'warning')
    return
  }
  if (!form.stu_id.trim()) {
    toast.push('请输入学号', 'warning')
    return
  }
  if (!form.password) {
    toast.push('请输入初始密码', 'warning')
    return
  }

  submitting.value = true
  try {
    await saveAdminStudent({
      class_id: classId.value,
      name: form.name.trim(),
      stu_id: form.stu_id.trim(),
      password: form.password,
    })
    toast.push('学生添加成功', 'success')
    goBack()
  } catch {
    toast.push('添加失败，请稍后重试', 'error')
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
          <h2 class="text-2xl font-black text-gray-900 tracking-tight">添加学生</h2>
          <p class="text-sm font-bold text-gray-400">为班级新增学员，建立学习账号</p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#70C125] text-white text-sm font-black border-b-4 border-[#5E9E1A] hover:brightness-105 active:border-b-2 active:translate-y-0.5 transition-all"
          @click="goBack"
        >
          <ArrowLeft class="w-4 h-4" />
          返回学生列表
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
        <SkeletonBlock class="h-10 w-full" />
      </section>

      <section v-else class="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
        <div class="mb-6">
          <span class="block mb-2 text-sm font-black text-gray-900">当前所在班级</span>
          <span class="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#F0F9FF] text-[#1899D6] text-sm font-black">
            <School class="w-4 h-4" />
            {{ detail?.class_name ?? '—' }}
          </span>
        </div>

        <form class="flex flex-col gap-6" @submit.prevent="submit">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label class="block mb-2 text-sm font-black text-gray-900">学生姓名</label>
              <input v-model="form.name" type="text" placeholder="请输入学生姓名" :class="inputClass" />
            </div>
            <div>
              <label class="block mb-2 text-sm font-black text-gray-900">学号</label>
              <input v-model="form.stu_id" type="text" placeholder="如 S1007" :class="inputClass" />
            </div>
          </div>

          <div>
            <label class="block mb-2 text-sm font-black text-gray-900">初始密码</label>
            <input v-model="form.password" type="password" placeholder="请输入初始密码" :class="inputClass" />
            <p class="mt-2 text-xs font-bold text-[#9CA3AF]">
              邮箱由学生登录后自行设置，用于重置密码
            </p>
          </div>

          <div class="mt-2 flex items-center justify-end gap-3">
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
              <UserPlus class="w-5 h-5" />
              <span>{{ submitting ? '提交中…' : '添加学生' }}</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  </main>
</template>
