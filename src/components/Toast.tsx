import { createContext, ReactNode, useContext, useState } from 'react'
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { tx } from '../utils/i18n'
import { cn } from './ui'
type Tone = 'success' | 'error' | 'info'
const T = createContext<(msg: string, tone?: Tone) => void>(() => undefined)
export const useToast = () => useContext(T)
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<{ id: number; msg: string; tone: Tone }[]>([])
  const push = (msg: string, tone: Tone = 'info') => { const id = Date.now() + Math.random(); setItems((x) => [...x, { id, msg, tone }]); setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 6000) }
  const I = { success: CheckCircle2, error: AlertTriangle, info: Info }
  return <T.Provider value={push}>{children}
    <div className="fixed bottom-4 right-4 z-[60] flex max-w-sm flex-col gap-2" role="status" aria-live="polite">{items.map((i) => { const Ic = I[i.tone]; return <div key={i.id} className={cn('flex items-start gap-2 rounded-xl border bg-white p-3 text-sm shadow-lg', i.tone === 'success' && 'border-emerald-300', i.tone === 'error' && 'border-red-300', i.tone === 'info' && 'border-blue-300')}><Ic size={18} className={cn('mt-0.5 shrink-0', i.tone === 'success' && 'text-emerald-600', i.tone === 'error' && 'text-red-600', i.tone === 'info' && 'text-blue-600')} /><span>{tx(i.msg)}</span></div> })}</div></T.Provider>
}
