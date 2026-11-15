import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { X } from 'lucide-react'
import { tx } from '../utils/i18n'
import { isImgSrc } from '../utils'

export const cn = (...a: ClassValue[]) => twMerge(clsx(a))
const btn = cva('inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all active:scale-[.98] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500/40', {
  variants: {
    variant: { primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-600/20 hover:brightness-110', navy: 'bg-navy-900 text-white hover:bg-navy-700', outline: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50', ghost: 'text-slate-600 hover:bg-slate-100', danger: 'bg-red-600 text-white hover:bg-red-700', success: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm hover:brightness-110' },
    size: { sm: 'h-8 px-3', md: 'h-9 px-4', icon: 'h-8 w-8' },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
})
export function Button({ className, variant, size, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof btn>) {
  return <button className={cn(btn({ variant, size }), className)} {...p} />
}
const field = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20'
export const Input = ({ className, placeholder, ...p }: InputHTMLAttributes<HTMLInputElement>) => <input className={cn(field, 'h-9', className)} placeholder={placeholder ? tx(placeholder) : undefined} {...p} />
export const Textarea = ({ className, placeholder, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea className={cn(field, 'min-h-[80px]', className)} placeholder={placeholder ? tx(placeholder) : undefined} {...p} />
export const Select = ({ className, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => <select className={cn(field, 'h-9', className)} {...p} />
export const Field = ({ label, error, children }: { label: string; error?: string; children: ReactNode }) => (
  <label className="block space-y-1"><span className="text-xs font-medium text-slate-600">{tx(label)}</span>{children}{error && <span className="block text-xs text-red-600">{tx(error)}</span>}</label>
)
export const Card = ({ className, children }: { className?: string; children: ReactNode }) => <div className={cn('rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm shadow-slate-200/50 transition-shadow', className)}>{children}</div>
const tones = { slate: 'bg-slate-100 text-slate-600', blue: 'bg-blue-50 text-blue-700', green: 'bg-emerald-50 text-emerald-700', orange: 'bg-orange-50 text-orange-700', red: 'bg-red-50 text-red-700' }
export const Badge = ({ tone = 'slate', children }: { tone?: keyof typeof tones; children: ReactNode }) => <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', tones[tone])}>{children}</span>
export const Progress = ({ value, tone }: { value: number; tone?: 'green' | 'blue' }) => (
  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100"><div className={cn('h-full rounded-full transition-all', (tone || (value === 100 ? 'green' : 'blue')) === 'green' ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500')} style={{ width: `${value}%` }} /></div>
)
export const PageHeader = ({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-semibold tracking-tight text-navy-900">{tx(title)}</h1>{desc && <p className="mt-1 text-sm text-slate-500">{tx(desc)}</p>}</div>{action}</div>
)
const sg = { blue: 'from-blue-500 to-indigo-500', green: 'from-emerald-400 to-teal-500', orange: 'from-amber-400 to-orange-500' }
export const Stat = ({ icon, label, value, tone = 'blue' }: { icon: ReactNode; label: string; value: ReactNode; tone?: 'blue' | 'green' | 'orange' }) => (
  <Card className="flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-md"><div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md', sg[tone])}>{icon}</div><div><div className="text-2xl font-semibold text-navy-900">{value}</div><div className="text-xs text-slate-500">{tx(label)}</div></div></Card>
)
export const Empty = ({ text }: { text: string }) => <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">🌱 {tx(text)}</div>
export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className={cn('max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-5 shadow-xl', wide ? 'max-w-3xl' : 'max-w-md')} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between"><h3 className="font-semibold text-navy-900">{tx(title)}</h3><Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button></div>
        {children}
      </div>
    </div>
  )
}
export const Table = ({ head, children }: { head: string[]; children: ReactNode }) => (
  <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white shadow-sm"><table className="w-full text-left text-sm"><thead className="border-b bg-slate-50 text-xs uppercase text-slate-500"><tr>{head.map((h, i) => <th key={i} className="px-4 py-3 font-medium">{tx(h)}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 [&_td]:px-4 [&_td]:py-3">{children}</tbody></table></div>
)
export const thumbBg: Record<string, string> = { blue: 'from-blue-500 to-indigo-700', orange: 'from-amber-400 to-rose-500', indigo: 'from-indigo-400 to-purple-600', slate: 'from-slate-400 to-slate-700', emerald: 'from-emerald-400 to-teal-600', rose: 'from-rose-400 to-fuchsia-600' }
export const Thumb = ({ src, className }: { src: string; className?: string }) =>
  isImgSrc(src) ? <img src={src} referrerPolicy="no-referrer" alt="" className={cn('object-cover', className)} /> : <div className={cn('bg-gradient-to-br', thumbBg[src] || thumbBg.blue, className)} />
