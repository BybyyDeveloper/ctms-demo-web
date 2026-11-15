import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Company, Db, Role, User } from '../types'
import { clearTables, emptyDb, saveDb } from '../services/db'
import { clearFiles, gcFiles } from '../services/files'
import { dummyVerify, hashPassword, verifyPassword } from '../services/security'
import { uid } from '../utils'
import { LIMITS_USERS, planOf } from '../features/billing/plans'
import { tx } from '../utils/i18n'

interface RegisterInput { name: string; email: string; password: string; role: Role; companyName?: string }
interface Ctx {
  db: Db; me: User | null; company: Company | null
  update: (fn: (d: Db) => void) => void
  login: (email: string, pw: string) => Promise<string | null>
  register: (i: RegisterInput) => Promise<string | null>
  join: (code: string) => string | null
  setPassword: (userId: string, pw: string, mustChange?: boolean) => Promise<void>
  logout: (notice?: string) => void; eraseAll: () => Promise<void>
}
const C = createContext<Ctx>(null as unknown as Ctx)
export const useApp = () => useContext(C)
export const log = (d: Db, text: string, companyId?: string, userId?: string) => { d.activities.unshift({ id: uid(), text, companyId, userId, at: new Date().toISOString() }); d.activities = d.activities.slice(0, 80) }

export const audit = (d: Db, text: string, companyId?: string) => { d.audit.unshift({ id: uid(), companyId, text, at: new Date().toISOString() }); d.audit = d.audit.slice(0, 300) }
const SES = 'ctms_session_v2', IDLE = 30 * 60e3, MAX = 12 * 3600e3, LOCK_AFTER = 5, LOCK_MS = 5 * 60e3
type Ses = { uid: string; exp: number; last: number }
const readSes = (): Ses | null => { try { const s = JSON.parse(localStorage.getItem(SES) || 'null') as Ses | null; const n = Date.now(); return s && n < s.exp && n - s.last < IDLE ? s : null } catch { return null } }
const locked = (d: Db, key: string) => { const a = d.attempts[key]; return a && a.until > Date.now() ? tx('Too many attempts. Try again in {m} minutes.', { m: Math.ceil((a.until - Date.now()) / 60000) }) : null }
const fail = (d: Db, key: string) => { const c = d.attempts[key] || { n: 0, until: 0 }; c.n += 1; if (c.n >= LOCK_AFTER) { c.until = Date.now() + LOCK_MS; c.n = 0 } d.attempts[key] = c; for (const k of Object.keys(d.attempts)) if (d.attempts[k].n === 0 && d.attempts[k].until < Date.now()) delete d.attempts[k] }

export function AppProvider({ children, initial }: { children: ReactNode; initial: Db }) {
  const [db, setDb] = useState<Db>(initial)
  const [sid, setSid] = useState<string | null>(() => readSes()?.uid ?? null)
  useEffect(() => { saveDb(db) }, [db])
  useEffect(() => { gcFiles(new Set(initial.trainings.flatMap((t) => t.modules.flatMap((m) => m.materials.map((x) => x.content))))) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const update = (fn: (d: Db) => void) => setDb((p) => { const n = structuredClone(p); fn(n); return n })
  const me = db.users.find((u) => u.id === sid) || null
  const company = db.companies.find((c) => c.id === me?.companyId) || null
  const start = (id: string) => { const n = Date.now(); localStorage.setItem(SES, JSON.stringify({ uid: id, exp: n + MAX, last: n })); setSid(id) }
  const logout = (notice?: string) => { localStorage.removeItem(SES); if (notice) sessionStorage.setItem('ctms_notice', notice); setSid(null) }

  useEffect(() => {
    if (!sid) return
    let w = 0
    const touch = () => { const n = Date.now(); if (n - w < 10000) return; w = n; const s = readSes(); if (s) localStorage.setItem(SES, JSON.stringify({ ...s, last: n })) }
    const check = () => { if (!readSes()) logout('Your session expired. Please log in again.') }
    const onStore = (e: StorageEvent) => { if (e.key === SES && !e.newValue) setSid(null) }
    const ev = ['click', 'keydown', 'touchstart'] as const
    ev.forEach((x) => window.addEventListener(x, touch)); window.addEventListener('storage', onStore)
    const iv = setInterval(check, 15000)
    return () => { ev.forEach((x) => window.removeEventListener(x, touch)); window.removeEventListener('storage', onStore); clearInterval(iv) }
  }, [sid])
  // akun yang dihapus / sesi tak valid
  useEffect(() => { if (sid && !me) logout() }, [sid, me]) // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (email: string, pw: string) => {
    const key = email.trim().toLowerCase(), lk = locked(db, key)
    if (lk) return lk
    const u = db.users.find((x) => x.email.toLowerCase() === key)
    const ok = u ? await verifyPassword(pw, u.pw) : (await dummyVerify(pw), false)
    if (!u || !ok) { update((d) => fail(d, key)); return 'Invalid email or password' }
    const co = db.companies.find((c) => c.id === u.companyId)
    if (u.role !== 'admin' && co && !co.active) return 'Your organization account is deactivated. Contact the platform admin.'
    update((d) => { delete d.attempts[key]; audit(d, `${u.name} logged in`, u.companyId) })
    start(u.id); return null
  }
  const register = async (i: RegisterInput) => {
    const email = i.email.trim().toLowerCase()
    if (db.users.some((u) => u.email.toLowerCase() === email)) return 'Email is already registered'
    const role: Role = db.users.length === 0 ? 'admin' : i.role === 'organization' ? 'organization' : 'user' // admin hanya akun pertama
    const pw = await hashPassword(i.password), id = uid(), cid = role === 'organization' ? uid() : undefined, now = new Date().toISOString()
    update((d) => {
      if (cid) d.companies.push({ id: cid, name: (i.companyName || '').trim(), industry: 'General', active: true, createdAt: now })
      d.users.push({ id, name: i.name.trim(), email: i.email.trim(), pw, role, companyId: cid, createdAt: now }); audit(d, `Account created: ${i.name.trim()} (${role})`, cid)
    })
    start(id); return null
  }
  const join = (raw: string) => {
    if (!me) return 'Invalid or revoked code'
    const key = 'join:' + me.id, lk = locked(db, key)
    if (lk) return lk
    const code = raw.trim().toUpperCase()
    const inv = /^CTMS-[A-Z0-9]{8}$/.test(code) ? db.invites.find((i) => i.code === code && i.active) : undefined
    const co = inv && db.companies.find((c) => c.id === inv.companyId)
    if (!inv || !co || !co.active) { update((d) => fail(d, key)); return 'Invalid or revoked code' }
    if (db.users.filter((u) => u.role === 'user' && u.companyId === co.id).length >= LIMITS_USERS(planOf(co))) return 'This organization has reached its user limit.'
    update((d) => { d.users.find((u) => u.id === me.id)!.companyId = inv.companyId; delete d.attempts[key]; log(d, `${me.name} joined the organization`, inv.companyId); audit(d, `${me.name} joined with an invitation code`, inv.companyId) })
    return null
  }
  const setPassword = async (userId: string, pw: string, mustChange = false) => { const h = await hashPassword(pw); update((d) => { const u = d.users.find((x) => x.id === userId); if (u) { u.pw = h; u.mustChange = mustChange } }) }
  const eraseAll = async () => { await Promise.all([clearTables(), clearFiles()]); localStorage.removeItem(SES); setDb(emptyDb()); setSid(null) }
  return <C.Provider value={{ db, me, company, update, login, register, join, setPassword, logout, eraseAll }}>{children}</C.Provider>
}
