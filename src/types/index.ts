export type Role = 'admin' | 'organization' | 'user'
export interface Company { logo?: string; plan?: 'free' | 'premium' | 'pro'; planUntil?: string; cycle?: 'monthly' | 'yearly'; certSigner?: string; certTitle?: string; id: string; name: string; industry: string; active: boolean; createdAt: string }
export interface User { id: string; name: string; email: string; pw: string; mustChange?: boolean; role: Role; companyId?: string; position?: string; createdAt: string }
export interface Invite { id: string; companyId: string; code: string; active: boolean; createdAt: string; revokedAt?: string }
export interface Category { id: string; companyId: string; name: string }
export type MatType = 'text' | 'image' | 'video' | 'doc' | 'checklist'
export interface Material { id: string; title: string; type: MatType; content: string }
export interface Module { id: string; title: string; materials: Material[] }
export interface Question { q: string; options: string[]; answer: number }
export type Level = 'Beginner' | 'Intermediate' | 'Advanced'
export interface Training {
  id: string; companyId: string; title: string; description: string; categoryId: string; thumbnail: string
  level: Level; duration: number; createdAt: string; deadline: string; status: 'draft' | 'published'
  modules: Module[]; quiz: Question[]
}
export interface Payment { id: string; companyId: string; plan: 'premium' | 'pro'; cycle: 'monthly' | 'yearly'; amount: number; method: string; ref: string; invoice: string; status: 'paid'; at: string }
export interface AuditEntry { id: string; companyId?: string; text: string; at: string }
export interface Assignment { id: string; trainingId: string; userId: string }
export interface Activity { id: string; companyId?: string; userId?: string; text: string; at: string }
export interface Db {
  companies: Company[]; users: User[]; invites: Invite[]; categories: Category[]; trainings: Training[]
  assignments: Assignment[]; progress: Record<string, Record<string, string>>
  quizResults: Record<string, { score: number; total: number; at: string }>; activities: Activity[]
  attempts: Record<string, { n: number; until: number }>; payments: Payment[]; audit: AuditEntry[]
}
