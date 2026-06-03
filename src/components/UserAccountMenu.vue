<script setup lang="ts">
import { computed, ref } from 'vue'
import { KeyRound, Loader2 } from 'lucide-vue-next'
import { editUserPassword, type EditPasswordResponse } from '../api/endpoints'
import { useAsync } from '../composables/useAsync'
import { useToast } from '../composables/useToast'
import { useCurrentUserSummary } from '../composables/useCurrentUserSummary'
import { useAuth } from '../stores/auth'

defineProps<{
  compact?: boolean
}>()

const toast = useToast()
const auth = useAuth()
const currentUser = useCurrentUserSummary()
const saveReq = useAsync<EditPasswordResponse>()

const menuOpen = ref(false)
const modalOpen = ref(false)
const oldPassword = ref('')
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

const resetForm = () => {
  oldPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
}

const openPasswordModal = () => {
  menuOpen.value = false
  modalOpen.value = true
}

const closePasswordModal = () => {
  if (saveReq.loading.value) return
  modalOpen.value = false
  resetForm()
}

const submitPassword = async () => {
  if (!oldPassword.value) {
    toast.push('请输入当前密码', 'warning')
    return
  }
  if (passwordError.value) {
    toast.push(passwordError.value, 'warning')
    return
  }
  const res = await saveReq.run(() => editUserPassword({ oldPassword: oldPassword.value, password: newPassword.value }))
  localStorage.setItem('token', res.access_token)
  auth.markPasswordChanged()
  toast.push('密码已修改', 'success')
  closePasswordModal()
}
</script>

<template>
  <div
    class="relative hidden sm:block"
    @mouseenter="menuOpen = true"
    @mouseleave="menuOpen = false"
  >
    <button
      type="button"
      :class="[
        'flex items-center gap-3 rounded-2xl border bg-white px-3 py-2 text-left transition-colors',
        compact ? 'border-[#E2E8F0] shadow-sm hover:bg-[#F8FAFC]' : 'border-gray-100 bg-[#F8F9FA] hover:bg-white',
      ]"
    >
      <span class="max-w-32 truncate text-sm font-black" :class="compact ? 'text-[#334155]' : 'text-gray-700'">
        {{ currentUser.displayName.value }}
      </span>
      <div
        :class="[
          'w-9 h-9 rounded-full border-2 p-0.5 overflow-hidden flex items-center justify-center shrink-0',
          compact ? 'border-[#58CC02] bg-[#EAF0DD]' : 'border-[#70C125] bg-blue-50',
        ]"
      >
        <img :src="currentUser.avatarSrc.value" alt="Avatar" class="w-full h-full object-cover rounded-full" />
      </div>
    </button>

    <div
      v-if="menuOpen"
      class="absolute right-0 top-[calc(100%+8px)] z-40 w-44 rounded-xl border border-[#E2E8F0] bg-white p-1.5 shadow-[0px_18px_38px_rgba(15,23,42,0.14)]"
    >
      <button
        type="button"
        class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-black text-[#334155] hover:bg-[#F2F5E8] hover:text-[#356B00]"
        @click="openPasswordModal"
      >
        <KeyRound class="h-4 w-4" />
        修改密码
      </button>
    </div>
  </div>

  <button
    type="button"
    class="sm:hidden w-10 h-10 rounded-full border-2 border-[#70C125] p-0.5 overflow-hidden flex items-center justify-center bg-blue-50"
    @click="openPasswordModal"
  >
    <img :src="currentUser.avatarSrc.value" alt="Avatar" class="w-full h-full object-cover rounded-full" />
  </button>

  <Teleport to="body">
    <div
      v-if="modalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 backdrop-blur-sm"
      @click.self="closePasswordModal"
    >
      <form
        class="w-full max-w-[420px] rounded-2xl bg-white p-6 shadow-[0px_25px_55px_rgba(15,23,42,0.22)]"
        @submit.prevent="submitPassword"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-lg font-black text-[#1F2937]">修改密码</h2>
            <p class="mt-1 text-sm font-bold text-[#94A3B8]">更新当前登录账号的密码</p>
          </div>
          <button type="button" class="text-xl font-black text-[#94A3B8] hover:text-[#334155]" @click="closePasswordModal">
            ×
          </button>
        </div>

        <div class="mt-5 flex flex-col gap-4">
          <label class="flex flex-col gap-2">
            <span class="text-sm font-black text-[#475569]">当前密码</span>
            <input
              v-model="oldPassword"
              type="password"
              autocomplete="current-password"
              class="h-11 rounded-xl border border-[#E2E8F0] px-3 text-sm font-bold text-[#1F2937] outline-none focus:border-[#58CC02]"
            />
          </label>

          <label class="flex flex-col gap-2">
            <span class="text-sm font-black text-[#475569]">新密码</span>
            <input
              v-model="newPassword"
              type="password"
              autocomplete="new-password"
              class="h-11 rounded-xl border border-[#E2E8F0] px-3 text-sm font-bold text-[#1F2937] outline-none focus:border-[#58CC02]"
            />
          </label>

          <label class="flex flex-col gap-2">
            <span class="text-sm font-black text-[#475569]">确认新密码</span>
            <input
              v-model="confirmPassword"
              type="password"
              autocomplete="new-password"
              class="h-11 rounded-xl border border-[#E2E8F0] px-3 text-sm font-bold text-[#1F2937] outline-none focus:border-[#58CC02]"
            />
          </label>

          <p v-if="passwordError" class="text-xs font-bold text-[#BA1A1A]">{{ passwordError }}</p>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            class="rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm font-black text-[#475569] hover:bg-[#F8FAFC]"
            @click="closePasswordModal"
          >
            取消
          </button>
          <button
            type="submit"
            class="inline-flex items-center gap-2 rounded-xl bg-[#356B00] px-4 py-2 text-sm font-black text-white hover:bg-[#2E5E00] disabled:opacity-60"
            :disabled="saveReq.loading.value"
          >
            <Loader2 v-if="saveReq.loading.value" class="h-4 w-4 animate-spin" />
            {{ saveReq.loading.value ? '提交中' : '确认修改' }}
          </button>
        </div>
      </form>
    </div>
  </Teleport>
</template>
