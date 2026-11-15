import { Company } from '../../types'
export type Plan = 'free' | 'premium' | 'pro'
export type Feature = 'certificate' | 'export' | 'analytics' | 'audit' | 'branding'
export const PLANS: Record<Plan, { name: string; monthly: number; yearly: number; users: number; trainings: number; storageMB: number; features: Feature[] }> = {
  free: { name: 'Free', monthly: 0, yearly: 0, users: 25, trainings: 3, storageMB: 100, features: [] },
  premium: { name: 'Premium', monthly: 149000, yearly: 1490000, users: 250, trainings: 25, storageMB: 5120, features: ['certificate', 'export'] },
  pro: { name: 'Pro', monthly: 499000, yearly: 4990000, users: Infinity, trainings: Infinity, storageMB: 51200, features: ['certificate', 'export', 'analytics', 'audit', 'branding'] },
}
export const RANK: Record<Plan, number> = { free: 0, premium: 1, pro: 2 }
export const TAX = 0.11
/** Paket efektif: kembali ke Free bila masa berlaku habis. */
export const planOf = (c: Company | null | undefined): Plan => (c && c.plan && c.plan !== 'free' && c.planUntil && new Date(c.planUntil) > new Date() ? c.plan : 'free')
export const can = (p: Plan, f: Feature) => PLANS[p].features.includes(f)
export const idr = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
const esc = (c: string) => { let s = String(c ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s } // cegah CSV/formula injection
export const toCsv = (rows: string[][]) => rows.map((r) => r.map(esc).join(',')).join('\r\n')
export function downloadCsv(name: string, rows: string[][]) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['\ufeff' + toCsv(rows)], { type: 'text/csv;charset=utf-8' })); a.download = name; a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
export const LIMITS_USERS = (p: Plan) => PLANS[p].users
