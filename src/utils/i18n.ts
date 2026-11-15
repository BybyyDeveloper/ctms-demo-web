import { PAIRS } from '../data/i18n'
export type Lang = 'id' | 'en'
let lang: Lang = (localStorage.getItem('ctms_lang') as Lang) || 'id'
document.documentElement.lang = lang
const listeners = new Set<() => void>()
const map = new Map<string, [string, string]>()
PAIRS.forEach((p) => { map.set(p[0], p); map.set(p[1], p) })
export const getLang = () => lang
export const setLang = (l: Lang) => { lang = l; localStorage.setItem('ctms_lang', l); document.documentElement.lang = l; listeners.forEach((f) => f()) }
export const subscribeLang = (f: () => void) => { listeners.add(f); return () => { listeners.delete(f) } }
/** Terjemahkan teks UI. Variabel: tx('Hello {n}', { n: 1 }) */
export function tx(s: string | undefined | null, vars?: Record<string, string | number>): string {
  if (!s) return ''
  const p = map.get(s.trim())
  let out = p ? (lang === 'en' ? p[0] : p[1]) : s
  if (vars) out = out.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))
  return out
}
