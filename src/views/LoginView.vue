<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { login } from '../api/endpoints'
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

const submit = async () => {
  await req.run(async () => {
    const session = await login({
      institute: institute.value.trim(),
      username: username.value.trim(),
      password: password.value,
    })
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
        <label class="bg-[#F8F9FA] border border-gray-100 rounded-2xl p-4 flex flex-col gap-2">
          <span class="text-xs font-black text-gray-400 uppercase tracking-widest">机构</span>
          <input
            v-model="institute"
            class="bg-transparent outline-none text-sm font-bold text-gray-800 placeholder:text-gray-400"
            placeholder="例如：xx中学"
            autocomplete="organization"
          />
        </label>

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

