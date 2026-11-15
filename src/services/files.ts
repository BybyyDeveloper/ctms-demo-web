// Penyimpanan file upload (foto/video/dokumen) di IndexedDB browser. Hanya tersedia di browser yang sama.
import { uid } from '../utils'
export interface StoredFile { blob: Blob; name: string; size: number; type: string }
const DB = 'ctms_files', ST = 'files'
let conn: Promise<IDBDatabase> | null = null
const open = () => (conn ||= new Promise<IDBDatabase>((res, rej) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore(ST); r.onsuccess = () => res(r.result); r.onerror = () => { conn = null; rej(r.error) } }))
const run = <T,>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>) => open().then((db) => new Promise<T>((res, rej) => { const q = fn(db.transaction(ST, mode).objectStore(ST)); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error) }))
export const isIdb = (s: string) => s.startsWith('idb:')
export const putFile = async (f: File) => { const id = uid() + uid(); navigator.storage?.persist?.(); await run('readwrite', (s) => s.put({ blob: f, name: f.name, size: f.size, type: f.type }, id)); return 'idb:' + id }
export const getFile = (ref: string) => run<StoredFile | undefined>('readonly', (s) => s.get(ref.slice(4)))
export const deleteFile = (ref: string) => run('readwrite', (s) => s.delete(ref.slice(4))).catch(() => undefined)
export const clearFiles = () => run('readwrite', (s) => s.clear()).catch(() => undefined)
export const gcFiles = async (keep: Set<string>) => { try { const keys = await run<IDBValidKey[]>('readonly', (s) => s.getAllKeys()); for (const k of keys) if (!keep.has('idb:' + String(k))) await run('readwrite', (s) => s.delete(k)) } catch { /* ignore */ } }
export const usedBytes = () => open().then((db) => new Promise<number>((res) => { let sum = 0; const r = db.transaction(ST, 'readonly').objectStore(ST).openCursor(); r.onsuccess = () => { const c = r.result; if (c) { sum += (c.value as StoredFile).size || 0; c.continue() } else res(sum) }; r.onerror = () => res(sum) })).catch(() => 0)
