export type StudentTaskAvailabilityStatus = 'inactive' | 'not_started' | 'ended' | 'attempts_exhausted' | 'open'

export type StudentTaskAvailabilityInput = {
  isActive?: boolean | null
  availableFrom?: string | null
  availableUntil?: string | null
  maxAttempts?: number | null
  attemptCount?: number | null
}

const parseTime = (value?: string | null) => {
  if (!value) return Number.NaN
  return new Date(value).getTime()
}

export function getStudentTaskAvailability(input: StudentTaskAvailabilityInput): StudentTaskAvailabilityStatus {
  if (!input.isActive) return 'inactive'

  const now = Date.now()
  const start = parseTime(input.availableFrom)
  const end = parseTime(input.availableUntil)
  if (Number.isFinite(start) && now < start) return 'not_started'
  if (Number.isFinite(end) && now > end) return 'ended'

  const maxAttempts = input.maxAttempts
  const attemptCount = input.attemptCount ?? 0
  if (maxAttempts != null && maxAttempts > 0 && attemptCount >= maxAttempts) return 'attempts_exhausted'

  return 'open'
}

/** 后端 /student/tasks 与 /student/task_detail 返回的 task_status 取值 */
export type StudentTaskApiStatus = 'not_started' | 'in_progress' | 'expired'

const apiStatusToAvailability: Record<StudentTaskApiStatus, StudentTaskAvailabilityStatus> = {
  not_started: 'not_started',
  in_progress: 'open',
  expired: 'ended',
}

/**
 * 列表接口（/student/tasks）不返回 available_from / available_until，
 * 无法在前端本地推算开放状态；此时应直接采用后端给出的权威 task_status。
 * 无该字段时返回 null，由调用方回退到本地推算。
 */
export function getStudentTaskAvailabilityFromApi(
  apiStatus?: StudentTaskApiStatus | null,
): StudentTaskAvailabilityStatus | null {
  if (!apiStatus) return null
  return apiStatusToAvailability[apiStatus] ?? null
}

export const studentTaskAvailabilityLabels: Record<StudentTaskAvailabilityStatus, string> = {
  inactive: '未启用',
  not_started: '未开始',
  ended: '已结束',
  attempts_exhausted: '次数已用完',
  open: '进行中',
}

export const studentTaskStartButtonLabels: Record<StudentTaskAvailabilityStatus, string> = {
  inactive: '暂未开放',
  not_started: '暂未开始',
  ended: '已结束',
  attempts_exhausted: '次数已用完',
  open: '进入测试',
}

export const studentTaskAvailabilityMessages: Record<StudentTaskAvailabilityStatus, string> = {
  inactive: '任务尚未开放，暂时无法测试。',
  not_started: '任务尚未开始，请在开放时间后再进行测试。',
  ended: '任务已结束，无法继续录音测评。',
  attempts_exhausted: '已达到该任务的最大提交次数，无法继续测试。',
  open: '',
}
