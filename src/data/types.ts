// أنواع البيانات المستخدمة في الواجهات (Mock فقط — ستُستبدل لاحقاً بأنواع قاعدة البيانات)

export type Role = 'citizen' | 'employee' | 'admin'

export type ComplaintStatus = 'new' | 'in_review' | 'in_progress' | 'resolved' | 'closed' | 'rejected'

export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export interface Category {
  id: string
  name: string
  icon: string // اسم أيقونة lucide
  departmentId: string
  slaDays: number
  active: boolean
}

export interface Department {
  id: string
  name: string
  head: string
  employees: number
  active: boolean
}

export interface District {
  id: string
  name: string
  lat: number
  lng: number
  population: number
  floodRisk: 'low' | 'medium' | 'high'
}

export interface TimelineEvent {
  id: string
  status: ComplaintStatus | 'assigned' | 'comment'
  title: string
  note?: string
  by: string
  at: string
}

export interface Comment {
  id: string
  author: string
  role: Role
  body: string
  at: string
  internal?: boolean
}

export interface Complaint {
  id: string
  number: string
  title: string
  description: string
  categoryId: string
  districtId: string
  address: string
  lat: number
  lng: number
  status: ComplaintStatus
  priority: Priority
  departmentId: string
  assignee?: string
  citizen: string
  createdAt: string
  updatedAt: string
  images: string[]
  afterImages?: string[]
  overdue?: boolean
  rating?: number
  timeline: TimelineEvent[]
  comments: Comment[]
}

export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: Role
  departmentId?: string
  status: 'active' | 'suspended'
  createdAt: string
  complaints?: number
}
