import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { Activity, Company, Training } from '../types'
import { ago, fmt } from '../utils'
import { tx } from '../utils/i18n'
import { Badge, Card, Progress, Thumb, cn } from './ui'

export const ActivityList = ({ items }: { items: Activity[] }) => (
  <ul className="divide-y divide-slate-100">{items.length === 0 && <li className="py-3 text-sm text-slate-500">{tx('No activity yet.')}</li>}
    {items.map((a) => <li key={a.id} className="flex items-start justify-between gap-3 py-2.5 text-sm"><span>{a.text}</span><span className="shrink-0 text-xs text-slate-400">{ago(a.at)}</span></li>)}</ul>
)
export const TrainingCard = ({ t, to, pct, status, tone }: { t: Training; to: string; pct?: number; status?: string; tone?: 'green' | 'orange' | 'slate' }) => (
  <Link to={to}><Card className="overflow-hidden p-0 hover:-translate-y-1 hover:shadow-lg">
    <Thumb src={t.thumbnail} className="h-28 w-full" />
    <div className="space-y-2 p-4"><div className="flex items-center justify-between"><Badge tone="blue">{tx(t.level)}</Badge>{status && <Badge tone={tone}>{tx(status)}</Badge>}</div>
      <h3 className="font-semibold leading-snug text-navy-900">{t.title}</h3>
      <div className="flex items-center gap-3 text-xs text-slate-500"><span className="flex items-center gap-1"><Clock size={12} />{t.duration} {tx('min')}</span><span>{tx('Due')} {fmt(t.deadline)}</span></div>
      {pct !== undefined && <div className="flex items-center gap-2"><Progress value={pct} /><span className="text-xs text-slate-500">{pct}%</span></div>}
    </div></Card></Link>
)
export const CompanyLogo = ({ c, className }: { c: Company | null; className?: string }) =>
  c?.logo ? <img src={c.logo} alt={c.name} className={cn('rounded-xl bg-white object-contain', className)} /> : <div className={cn('flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 font-semibold text-white', className)}>{(c?.name || '?').replace('PT. ', '').slice(0, 1)}</div>
