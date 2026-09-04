import { computed, ref, watch } from 'vue'
import avatarFallback from '../assets/figma/avatar.png'
import { getUserDetail, type UserDetail } from '../api/endpoints'
import { useAuth } from '../stores/auth'

const userDetail = ref<UserDetail | null>(null)
const loading = ref(false)
const loadedForUserId = ref<string | null>(null)

export function useCurrentUserSummary() {
  const auth = useAuth()

  const fallbackName = computed(() => {
    const userType = auth.userType.value === 'teacher' ? '教师' : '学生'
    return `${userType} ${auth.session.value?.user_id ?? ''}`.trim()
  })

  const displayName = computed(() => userDetail.value?.username || fallbackName.value || '用户')
  const avatarSrc = computed(() => userDetail.value?.avatar_url || avatarFallback)

  const load = async () => {
    const userId = auth.session.value?.user_id
    if (!userId || loading.value || loadedForUserId.value === userId) return
    loading.value = true
    try {
      const res = await getUserDetail()
      userDetail.value = res.data
      loadedForUserId.value = userId
    } catch {
      userDetail.value = null
      loadedForUserId.value = userId
    } finally {
      loading.value = false
    }
  }

  watch(() => auth.session.value?.user_id, (userId, previousUserId) => {
    if (userId !== previousUserId) {
      userDetail.value = null
      loadedForUserId.value = null
    }
    if (userId) void load()
  }, { immediate: true })

  return {
    avatarSrc,
    displayName,
    load,
    loading: computed(() => loading.value),
    userDetail: computed(() => userDetail.value),
  }
}
