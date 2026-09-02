export type ApplicationStatus =
  | 'wishlist'
  | 'applied'
  | 'phone_screen'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'accepted'
  | 'withdrawn'

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  'wishlist',
  'applied',
  'phone_screen',
  'interview',
  'offer',
  'rejected',
  'accepted',
  'withdrawn',
]

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  wishlist: 'Wishlist',
  applied: 'Applied',
  phone_screen: 'Phone screen',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
  accepted: 'Accepted',
  withdrawn: 'Withdrawn',
}

export interface User {
  id: number
  email: string
  full_name: string | null
  created_at: string
}

export interface Token {
  access_token: string
  token_type: string
}

export interface Company {
  id: number
  name: string
  website: string | null
  notes: string | null
  created_at: string
}

export type CompanyInput = Pick<Company, 'name' | 'website' | 'notes'>

export interface InterviewStage {
  id: number
  application_id: number
  stage_name: string
  scheduled_at: string | null
  completed: boolean
  notes: string | null
  created_at: string
}

export type InterviewStageInput = Pick<InterviewStage, 'stage_name' | 'scheduled_at' | 'completed' | 'notes'>

export interface Application {
  id: number
  role_title: string
  company_id: number
  job_url: string | null
  location: string | null
  salary_min: number | null
  salary_max: number | null
  source: string | null
  status: ApplicationStatus
  applied_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
  company: Company
  stages: InterviewStage[]
}

export type ApplicationInput = {
  role_title: string
  company_id: number
  job_url?: string | null
  location?: string | null
  salary_min?: number | null
  salary_max?: number | null
  source?: string | null
  status?: ApplicationStatus
  applied_date?: string | null
  notes?: string | null
}

export interface ApplicationList {
  total: number
  items: Application[]
}

export interface StatusCount {
  status: ApplicationStatus
  count: number
}

export interface StatsSummary {
  total_applications: number
  by_status: StatusCount[]
  response_rate: number
  interview_rate: number
  offer_rate: number
}

export interface TimelinePoint {
  period: string
  count: number
}

export interface StatsTimeline {
  points: TimelinePoint[]
}
