// Database lokal berbasis IndexedDB. State dimuat ke memori saat start dan ditulis ulang (write-through) setiap berubah.
import { Db } from '../types'
const NAME = 'ctms_data', ST = 'tables'
export const emptyDb = (): Db => ({ companies: [], users: [], invites: [], categories: [], trainings: [], assignments: [], progress: {}, quizResults: {}, activities: [], attempts: {}, payments: [], audit: [] })
let conn: Promise<IDBDatabase> | null = null
const open = () => (conn ||= new Promise<IDBDatabase>((res, rej) => { const r = indexedDB.open(NAME, 1); r.onupgradeneeded = () => r.result.createObjectStore(ST); r.onsuccess = () => res(r.result); r.onerror = () => { conn = null; rej(r.error) } }))
const req = <T,>(r: IDBRequest<T>) => new Promise<T>((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error) })
export let persistent = true

export async function loadDb(): Promise<Db> {
  // bersihkan sisa data versi lama
  for (const k of ['ctms_db_v1', 'ctms_session_v1']) localStorage.removeItem(k)
  try {
    const st = (await open()).transaction(ST, 'readonly').objectStore(ST)
    const [keys, vals] = await Promise.all([req(st.getAllKeys()), req(st.getAll())])
    const out: Record<string, unknown> = {}
    keys.forEach((k, i) => { out[String(k)] = vals[i] })
    return { ...emptyDb(), ...(out as Partial<Db>) }
  } catch { persistent = false; return emptyDb() }
}
let pending: Db | null = null, running = false
async function write(d: Db) {
  const db = await open(), tx = db.transaction(ST, 'readwrite'), st = tx.objectStore(ST)
  ;(Object.keys(d) as (keyof Db)[]).forEach((k) => st.put(d[k], k))
  await new Promise<void>((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error) })
}
export function saveDb(d: Db) {
  pending = d
  if (running) return
  running = true
  ;(async () => { while (pending) { const x = pending; pending = null; try { await write(x) } catch { persistent = false } } running = false })()
}
export async function clearTables() { try { const db = await open(); const tx = db.transaction(ST, 'readwrite'); tx.objectStore(ST).clear(); await new Promise<void>((r) => { tx.oncomplete = () => r(); tx.onerror = () => r() }) } catch { /* ignore */ } }
