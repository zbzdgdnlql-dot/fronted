<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getInstitutes, getStudentBasicInformation, login, searchInstitutes, type InstituteItem } from '../api/endpoints'
import { useAuth } from '../stores/auth'
import { useToast } from '../composables/useToast'
import { useAsync } from '../composables/useAsync'

const route = useRoute()
const router = useRouter()
const auth = useAuth()
const toast = useToast()
const req = useAsync<void>()

const institute = ref('')
const username = ref('')
const password = ref('')
const userType = ref<'Student' | 'Teacher' | 'Admin'>('Student')
const selectedInstituteId = ref('')
const instituteOptions = ref<InstituteItem[]>([])
const instituteLoading = ref(false)
const instituteLoadError = ref<string | null>(null)
const instituteFieldError = ref<string | null>(null)
const instituteMenuOpen = ref(false)
let instituteSearchTimer: ReturnType<typeof window.setTimeout> | undefined
let instituteRequestId = 0

const trimmedInstitute = computed(() => institute.value.trim())
const getInstituteSeq = (item: InstituteItem) => item.school_seq ?? item.school_id

const loadInstitutes = async (keyword = '') => {
  const requestId = ++instituteRequestId
  instituteLoading.value = true
  instituteLoadError.value = null
  try {
    const res = keyword ? await searchInstitutes(keyword) : await getInstitutes()
    if (requestId !== instituteRequestId) return
    instituteOptions.value = res.data.items ?? []
  } catch {
    if (requestId !== instituteRequestId) return
    instituteOptions.value = []
    instituteLoadError.value = '学校列表加载失败，请稍后重试'
  } finally {
    if (requestId === instituteRequestId) instituteLoading.value = false
  }
}

const openInstituteMenu = () => {
  instituteMenuOpen.value = true
  if (!instituteOptions.value.length) void loadInstitutes(trimmedInstitute.value)
}

const closeInstituteMenu = () => {
  window.setTimeout(() => {
    instituteMenuOpen.value = false
  }, 120)
}

const selectInstitute = (item: InstituteItem) => {
  selectedInstituteId.value = getInstituteSeq(item)
  institute.value = item.school_name
  instituteMenuOpen.value = false
}

watch(institute, (value) => {
  instituteFieldError.value = null

  if (selectedInstituteId.value) {
    const selected = instituteOptions.value.find((item) => getInstituteSeq(item) === selectedInstituteId.value)
    if (selected?.school_name !== value) selectedInstituteId.value = ''
  }

  if (instituteSearchTimer) window.clearTimeout(instituteSearchTimer)
  instituteSearchTimer = window.setTimeout(() => {
    if (!instituteMenuOpen.value) return
    void loadInstitutes(value.trim())
  }, 250)
})

onMounted(() => {
  void loadInstitutes()
})

const submit = async () => {
  if (!trimmedInstitute.value || !selectedInstituteId.value) {
    instituteFieldError.value = trimmedInstitute.value ? '请从列表中选择学校' : '请先选择学校'
    return
  }

  await req.run(async () => {
    const res = await login({
      institute: trimmedInstitute.value,
      school_seq: selectedInstituteId.value,
      user_type: userType.value,
      stu_id: username.value.trim(),
      password: password.value,
    })
    localStorage.setItem('token', res.access_token)
    const session = {
      user_id: res.user.user_id,
      user_type: res.user.user_type.toLowerCase(),
      must_change_password: res.must_change_password,
    }
    if (res.must_change_password) {
      auth.setSession(session)
      toast.push('首次登录请先修改密码', 'warning')
      await router.replace({ path: '/change-password', query: { redirect: (route.query.redirect as string | undefined) ?? '/' } })
      return
    }
    if (session.user_type === 'student') {
      const basic = await getStudentBasicInformation()
      const classContexts = basic.info.map((item) => ({
        class_id: item.class_id,
        class_name: item.class_name,
        teacher_name: Array.isArray(item.teacher_name) ? item.teacher_name.join('、') : item.teacher_name,
      }))
      const firstClass = classContexts[0]
      if (firstClass) {
        Object.assign(session, {
          class_context: firstClass,
          class_contexts: classContexts,
        })
      }
    }
    auth.setSession(session)
    toast.push('登录成功', 'success')
    const redirect = (route.query.redirect as string | undefined) ?? '/'
    await router.replace(redirect)
  })
}
</script>

<template>
  <main class="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
    <div class="w-full max-w-[520px] bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col gap-6">
      <div class="flex flex-col gap-2">
        <h1 class="text-2xl font-black text-gray-900 tracking-tight">登录</h1>
        <p class="text-sm font-bold text-gray-400">请输入机构与账号信息</p>
      </div>

      <div v-if="req.error.value" class="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm font-bold text-red-700">
        {{ req.error.value }}
      </div>

      <form class="flex flex-col gap-4" @submit.prevent="submit">
        <div class="relative">
          <label
            class="bg-[#F8F9FA] border rounded-2xl p-4 flex flex-col gap-2"
            :class="instituteFieldError ? 'border-red-200' : 'border-gray-100'"
          >
            <span class="text-xs font-black text-gray-400 uppercase tracking-widest">学校</span>
            <input
              v-model="institute"
              class="bg-transparent outline-none text-sm font-bold text-gray-800 placeholder:text-gray-400"
              placeholder="输入学校名称搜索"
              autocomplete="organization"
              @focus="openInstituteMenu"
              @blur="closeInstituteMenu"
            />
          </label>
          <p v-if="instituteFieldError" class="mt-2 px-1 text-xs font-bold text-red-600">{{ instituteFieldError }}</p>

          <div
            v-if="instituteMenuOpen"
            class="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-gray-100 bg-white shadow-lg"
          >
            <div v-if="instituteLoading" class="px-4 py-3 text-sm font-bold text-gray-400">学校加载中...</div>
            <div v-else-if="instituteLoadError" class="px-4 py-3 text-sm font-bold text-red-600">
              {{ instituteLoadError }}
            </div>
            <button
              v-for="item in instituteOptions"
              v-else
              :key="getInstituteSeq(item)"
              type="button"
              class="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold text-gray-700 hover:bg-[#F8F9FA]"
              @mousedown.prevent="selectInstitute(item)"
            >
              <span>{{ item.school_name }}</span>
              <span v-if="selectedInstituteId === getInstituteSeq(item)" class="text-xs font-black text-[#70C125]">已选</span>
            </button>
            <div
              v-if="!instituteLoading && !instituteLoadError && instituteOptions.length === 0"
              class="px-4 py-3 text-sm font-bold text-gray-400"
            >
              未找到相关学校
            </div>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3">
          <button
            type="button"
            class="rounded-2xl border-2 px-4 py-3 text-sm font-black transition-all"
            :class="userType === 'Student' ? 'border-[#70C125] bg-[#F4FAEE] text-[#70C125]' : 'border-gray-100 bg-white text-gray-400 hover:text-gray-600'"
            @click="userType = 'Student'"
          >
            学生
          </button>
          <button
            type="button"
            class="rounded-2xl border-2 px-4 py-3 text-sm font-black transition-all"
            :class="userType === 'Teacher' ? 'border-[#70C125] bg-[#F4FAEE] text-[#70C125]' : 'border-gray-100 bg-white text-gray-400 hover:text-gray-600'"
            @click="userType = 'Teacher'"
          >
            教师
          </button>
          <button
            type="button"
            class="rounded-2xl border-2 px-4 py-3 text-sm font-black transition-all"
            :class="userType === 'Admin' ? 'border-[#70C125] bg-[#F4FAEE] text-[#70C125]' : 'border-gray-100 bg-white text-gray-400 hover:text-gray-600'"
            @click="userType = 'Admin'"
          >
            管理员
          </button>
        </div>

        <label class="bg-[#F8F9FA] border border-gray-100 rounded-2xl p-4 flex flex-col gap-2">
          <span class="text-xs font-black text-gray-400 uppercase tracking-widest">账号</span>
          <input
            v-model="username"
            class="bg-transparent outline-none text-sm font-bold text-gray-800 placeholder:text-gray-400"
            placeholder="学号/工号"
            autocomplete="username"
          />
        </label>

        <label class="bg-[#F8F9FA] border border-gray-100 rounded-2xl p-4 flex flex-col gap-2">
          <span class="text-xs font-black text-gray-400 uppercase tracking-widest">密码</span>
          <input
            v-model="password"
            type="password"
            class="bg-transparent outline-none text-sm font-bold text-gray-800 placeholder:text-gray-400"
            placeholder="请输入密码"
            autocomplete="current-password"
          />
        </label>

        <button
          type="submit"
          class="mt-2 bg-[#70C125] text-white px-5 py-3 rounded-2xl font-black text-sm hover:bg-[#63ad20] border-b-4 border-[#5E9E1A] active:border-b-0 active:translate-y-1 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="req.loading.value"
        >
          {{ req.loading.value ? '登录中...' : '登录' }}
        </button>
      </form>
    </div>
  </main>
</template>
