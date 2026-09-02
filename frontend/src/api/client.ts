import type {
  Application,
  ApplicationInput,
  ApplicationList,
  ApplicationStatus,
  Company,
  CompanyInput,
  InterviewStage,
  InterviewStageInput,
  StatsSummary,
  StatsTimeline,
  Token,
  User,
} from './types'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

let authToken: string | null = null

export function setAuthToken(token: string | null): void {
  authToken = token
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  const isFormBody = options.body instanceof URLSearchParams
  if (options.body && !isFormBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (authToken) headers.set('Authorization', `Bearer ${authToken}`)

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })

  if (res.status === 204) return undefined as T

  const contentType = res.headers.get('content-type') ?? ''
  const data: unknown = contentType.includes('application/json') ? await res.json() : undefined

  if (!res.ok) {
    const detail =
      data && typeof data === 'object' && 'detail' in data ? (data as { detail: unknown }).detail : res.statusText
    throw new ApiError(res.status, typeof detail === 'string' ? detail : JSON.stringify(detail))
  }

  return data as T
}

function toQueryString(params: object): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params as Record<string, string | number | undefined>)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`)
    return res.ok
  } catch {
    return false
  }
}

export const authApi = {
  register: (email: string, password: string, fullName?: string) =>
    request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName || undefined }),
    }),

  login: (email: string, password: string) =>
    request<Token>('/auth/login', {
      method: 'POST',
      body: new URLSearchParams({ username: email, password }),
    }),

  me: () => request<User>('/auth/me'),
}

export const companiesApi = {
  list: () => request<Company[]>('/companies'),
  create: (payload: CompanyInput) =>
    request<Company>('/companies', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: number, payload: Partial<CompanyInput>) =>
    request<Company>(`/companies/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  remove: (id: number) => request<void>(`/companies/${id}`, { method: 'DELETE' }),
}

export interface ApplicationFilters {
  status?: ApplicationStatus
  q?: string
  skip?: number
  limit?: number
}

export const applicationsApi = {
  list: (filters: ApplicationFilters = {}) =>
    request<ApplicationList>(`/applications${toQueryString(filters)}`),
  get: (id: number) => request<Application>(`/applications/${id}`),
  create: (payload: ApplicationInput) =>
    request<Application>('/applications', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: number, payload: Partial<ApplicationInput>) =>
    request<Application>(`/applications/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  remove: (id: number) => request<void>(`/applications/${id}`, { method: 'DELETE' }),
  addStage: (applicationId: number, payload: InterviewStageInput) =>
    request<InterviewStage>(`/applications/${applicationId}/stages`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  removeStage: (applicationId: number, stageId: number) =>
    request<void>(`/applications/${applicationId}/stages/${stageId}`, { method: 'DELETE' }),
}

export const statsApi = {
  summary: () => request<StatsSummary>('/stats/summary'),
  timeline: (months = 6) => request<StatsTimeline>(`/stats/timeline?months=${months}`),
}

export const demoApi = {
  applications: () => request<ApplicationList>('/demo/applications'),
  summary: () => request<StatsSummary>('/demo/stats/summary'),
  timeline: (months = 6) => request<StatsTimeline>(`/demo/stats/timeline?months=${months}`),
}
