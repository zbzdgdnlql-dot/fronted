<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { KeyRound, Loader2, ShieldCheck } from 'lucide-vue-next'
import {
  editUserPassword,
  getStudentBasicInformation,
  logout as apiLogout,
  type EditPasswordResponse,
} from '../api/endpoints'
import { useAuth, type Session } from '../stores/auth'
import { useAsync } from '../composables/useAsync'
import { useToast } from '../composables/useToast'

const route = useRoute()
const router = useRouter()
const auth = useAuth()
const toast = useToast()
const saveReq = useAsync<EditPasswordResponse>()

const newPassword = ref('')
const confirmPassword = ref('')

const passwordError = computed(() => {
  if (!newPassword.value && !confirmPassword.value) return ''
  if (newPassword.value.length < 6) return '新密码至少 6 位'
  if (newPassword.value.length > 20) return '新密码最多 20 位'
  if (!/\d/.test(newPassword.value)) return '新密码需要包含数字'
  if (newPassword.value !== confirmPassword.value) return '两次输入的新密码不一致'
  return ''
})

const redirectTarget = computed(() => {
  const redirect = route.query.redirect as string | undefined
  if (redirect && redirect !== '/change-password') return redirect
  return auth.userType.value === 'teacher' ? '/teacher/overview' : '/'
})

const buildStudentSession = async (baseSession: Session) => {
  if (baseSession.user_type !== 'student') return baseSession
  const basic = await getStudentBasicInformation()
  const classContexts = basic.info.map((item) => ({
    class_id: item.class_id,
    class_name: item.class_name,
    teacher_name: Array.isArray(item.teacher_name) ? item.teacher_name.join('、') : item.teacher_name,
  }))
  const firstClass = classContexts.find((item) => item.class_id === baseSession.class_context?.class_id)
    ?? classContexts[0]

  return {
    ...baseSession,
    ...(firstClass ? { class_context: firstClass } : {}),
    class_contexts: classContexts,
  }
}

const submitPassword = async () => {
  if (passwordError.value) {
    toast.push(passwordError.value, 'warning')
    return
  }
  const session = auth.session.value
  if (!session) {
    await router.replace('/login')
    return
  }

  await saveReq.run(async () => {
    const res = await editUserPassword({ password: newPassword.value })
    localStorage.setItem('token', res.access_token)
    const nextSession = await buildStudentSession({
      ...session,
      must_change_password: false,
    })
    auth.setSession(nextSession)
    toast.push('密码已修改，请继续使用', 'success')
    await router.replace(redirectTarget.value)
    return res
  })
}

const switchAccount = async () => {
  try {
    await apiLogout()
  } catch {}
  auth.clearSession()
  await router.replace('/login')
}
</script>

<template>
  <main class="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
    <section class="w-full max-w-[500px] rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
      <div class="flex items-start gap-4">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F2F5E8] text-[#356B00]">
          <ShieldCheck class="h-6 w-6" />
        </div>
        <div>
          <h1 class="text-2xl font-black tracking-tight text-gray-900">首次登录需要修改密码</h1>
          <p class="mt-2 text-sm font-bold leading-relaxed text-gray-400">
            为了账号安全，请先设置一个新密码。完成后才可以进入系统。
          </p>
        </div>
      </div>

      <div v-if="saveReq.error.value" class="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
        {{ saveReq.error.value }}
      </div>

      <form class="mt-6 flex flex-col gap-4" @submit.prevent="submitPassword">
        <label class="flex flex-col gap-2 rounded-2xl border border-gray-100 bg-[#F8F9FA] p-4">
          <span class="text-xs font-black uppercase tracking-widest text-gray-400">新密码</span>
          <input
            v-model="newPassword"
            type="password"
            autocomplete="new-password"
            class="bg-transparent text-sm font-bold text-gray-800 outline-none placeholder:text-gray-400"
            placeholder="6-20 位，至少包含数字"
          />
        </label>

        <label class="flex flex-col gap-2 rounded-2xl border border-gray-100 bg-[#F8F9FA] p-4">
          <span class="text-xs font-black uppercase tracking-widest text-gray-400">确认新密码</span>
          <input
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
            class="bg-transparent text-sm font-bold text-gray-800 outline-none placeholder:text-gray-400"
            placeholder="再次输入新密码"
          />
        </label>

        <p v-if="passwordError" class="px-1 text-xs font-bold text-[#BA1A1A]">{{ passwordError }}</p>

        <button
          type="submit"
          class="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl border-b-4 border-[#2E5E00] bg-[#356B00] px-5 py-3 text-sm font-black text-white transition-all hover:bg-[#2E5E00] active:translate-y-1 active:border-b-0 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="saveReq.loading.value"
        >
          <Loader2 v-if="saveReq.loading.value" class="h-4 w-4 animate-spin" />
          <KeyRound v-else class="h-4 w-4" />
          {{ saveReq.loading.value ? '提交中...' : '确认修改并进入系统' }}
        </button>
      </form>

      <button
        type="button"
        class="mt-5 w-full rounded-2xl px-4 py-2 text-sm font-black text-gray-400 hover:bg-gray-50 hover:text-gray-600"
        @click="switchAccount"
      >
        退出并切换账号
      </button>
    </section>
  </main>
</template>
