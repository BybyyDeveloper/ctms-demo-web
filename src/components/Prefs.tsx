import { Moon, Sun } from 'lucide-react'
import { setLang } from '../utils/i18n'
import { setTheme, useLang, useTheme } from '../hooks/usePrefs'
import { cn } from './ui'

export default function Prefs({ dark }: { dark?: boolean }) {
  const lang = useLang(), theme = useTheme()
  const base = dark ? 'border-white/20 bg-white/10 text-white' : 'border-slate-200 bg-white text-slate-600'
  return (
    <div className="flex items-center gap-2">
      <div className={cn('flex overflow-hidden rounded-full border text-xs font-medium', base)}>
        {(['id', 'en'] as const).map((l) => <button key={l} onClick={() => setLang(l)} className={cn('px-2.5 py-1', lang === l && 'bg-blue-600 text-white')}>{l.toUpperCase()}</button>)}
      </div>
      <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Theme" className={cn('rounded-full border p-1.5', base)}>{theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}</button>
    </div>
  )
}
