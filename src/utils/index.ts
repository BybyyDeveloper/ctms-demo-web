import { Db, Training } from '../types'
export const uid = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), (x) => x.toString(16).padStart(2, '0')).join('')
export const fmt = (s: string) => (s ? new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-')
export const genCode = () => 'CTMS-' + Array.from(crypto.getRandomValues(new Uint8Array(8)), (x) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[x & 31]).join('')
export const mats = (t: Training) => t.modules.flatMap((m) => m.materials)
export type Status = 'Not started' | 'In progress' | 'Completed'
export function progressOf(db: Db, userId: string, t: Training) {
  const all = mats(t), p = db.progress[userId] || {}
  const done = all.filter((x) => p[x.id]).length
  const pct = all.length ? Math.round((done / all.length) * 100) : 0
  const status: Status = pct === 0 ? 'Not started' : pct === 100 ? 'Completed' : 'In progress'
  return { done, total: all.length, pct, status }
}
export const statusTone = (s: string) => (s === 'Completed' ? 'green' : s === 'In progress' ? 'orange' : 'slate') as 'green' | 'orange' | 'slate'
export const ytEmbed = (u: string) => { const m = u.match(/^https:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/); return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : '' }
export const isUrl = (s: string) => /^https?:\/\/\S+$/i.test(s)
export const ago = (iso: string) => { const m = Math.floor((Date.now() - new Date(iso).getTime()) / 6e4); return m < 1 ? 'just now' : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m / 60)}h ago` : `${Math.floor(m / 1440)}d ago` }
export const isImgSrc = (s: string) => /^(https?:\/\/|data:image\/(png|jpeg|webp|gif);base64,)/.test(s)
export const isHttp = (s: string) => /^https?:\/\/\S+$/i.test(s)
export const IMG_OK = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
export const VID_OK = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
export const DOC_EXT = /\.(pdf|docx?|pptx?|xlsx?|txt)$/i
export const fmtSize = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)
export const resizeImage = (f: File, max: number) => new Promise<string>((res, rej) => {
  const img = new Image(), u = URL.createObjectURL(f)
  img.onload = () => { const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u); res(c.toDataURL(f.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.85)) }
  img.onerror = () => rej(new Error('bad image')); img.src = u
})
