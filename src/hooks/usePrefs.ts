import { useSyncExternalStore } from 'react'
import { getLang, subscribeLang } from '../utils/i18n'
export type Theme = 'light' | 'dark'
export const useLang = () => useSyncExternalStore(subscribeLang, getLang, getLang)

let theme: Theme = (localStorage.getItem('ctms_theme') as Theme) || (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
const ls = new Set<() => void>()
const apply = () => document.documentElement.classList.toggle('dark', theme === 'dark')
apply()
export const setTheme = (t: Theme) => { theme = t; localStorage.setItem('ctms_theme', t); apply(); ls.forEach((f) => f()) }
export const useTheme = () => useSyncExternalStore((f) => { ls.add(f); return () => { ls.delete(f) } }, () => theme, () => theme)
