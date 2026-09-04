import { ref } from 'vue'
import { isApiError } from '../api/errors'

export function useAsync<T>() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const errorStatus = ref<number | null>(null)
  const data = ref<T | null>(null)

  const run = async (fn: () => Promise<T>) => {
    loading.value = true
    error.value = null
    errorStatus.value = null
    try {
      const res = await fn()
      data.value = res
      return res
    } catch (e) {
      if (isApiError(e)) {
        error.value = e.message
        errorStatus.value = e.status
      } else {
        error.value = '发生未知错误，请稍后重试'
        errorStatus.value = null
      }
      throw e
    } finally {
      loading.value = false
    }
  }

  return { loading, error, errorStatus, data, run }
}

