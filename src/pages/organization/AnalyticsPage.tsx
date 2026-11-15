import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useApp } from '../../contexts/AppContext'
import { progressOf } from '../../utils'
import { tx } from '../../utils/i18n'
import { Button, Card, Empty, PageHeader, Table } from '../../components/ui'
import { can, downloadCsv, planOf } from '../../features/billing/plans'

export default function Analytics() {
  const { db, company } = useApp(), plan = planOf(company), cid = company!.id
  if (!can(plan, 'analytics')) return (<><PageHeader title="Analytics & Audit" desc="Insights and a full record of activity." />
    <Card className="mx-auto max-w-lg space-y-3 text-center"><Lock className="mx-auto text-slate-400" size={32} /><p className="font-medium">{tx('Analytics and audit log are available on the Pro plan.')}</p>
      <ul className="space-y-1 text-sm text-slate-500"><li>{tx('Completion by category')}</li><li>{tx('Status distribution')}</li><li>{tx('Activity (last 14 days)')}</li><li>{tx('Audit log')}</li></ul><Link to="/organization/subscription"><Button>{tx('Upgrade to Pro')}</Button></Link></Card></>)
  const trainings = db.trainings.filter((t) => t.companyId === cid), users = db.users.filter((u) => u.role === 'user' && u.companyId === cid)
  const rows = db.assignments.filter((a) => trainings.some((t) => t.id === a.trainingId) && users.some((u) => u.id === a.userId)).map((a) => progressOf(db, a.userId, trainings.find((t) => t.id === a.trainingId)!))
  const trainingOf = (a: { trainingId: string }) => trainings.find((t) => t.id === a.trainingId)!
  const cats = db.categories.filter((k) => k.companyId === cid).map((k) => { const r = db.assignments.filter((a) => trainingOf(a)?.categoryId === k.id && users.some((u) => u.id === a.userId)).map((a) => progressOf(db, a.userId, trainingOf(a)).pct); return { name: k.name, avg: r.length ? Math.round(r.reduce((s, x) => s + x, 0) / r.length) : 0 } })
  const status = (['Not started', 'In progress', 'Completed'] as const).map((s) => ({ name: tx(s), value: rows.filter((r) => r.status === s).length }))
  const events = [...db.audit.filter((a) => a.companyId === cid), ...db.activities.filter((a) => a.companyId === cid)].sort((a, b) => b.at.localeCompare(a.at))
  const trend = Array.from({ length: 14 }, (_, i) => { const d = new Date(Date.now() - (13 - i) * 864e5), k = d.toISOString().slice(0, 10); return { name: `${d.getDate()}/${d.getMonth() + 1}`, events: events.filter((e) => e.at.slice(0, 10) === k).length } })
  const chart = (data: object[], key: string, line?: boolean) => <div className="h-56"><ResponsiveContainer>{line ? <LineChart data={data}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" fontSize={11} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip /><Line dataKey={key} stroke="#2563eb" strokeWidth={2} dot={false} /></LineChart> : <BarChart data={data}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" fontSize={11} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip /><Bar dataKey={key} fill="#6366f1" radius={[4, 4, 0, 0]} /></BarChart>}</ResponsiveContainer></div>
  return (<><PageHeader title="Analytics & Audit" desc="Insights and a full record of activity." />
    <div className="grid gap-4 lg:grid-cols-3"><Card><h3 className="mb-2 font-semibold">{tx('Completion by category')}</h3>{cats.length ? chart(cats, 'avg') : <Empty text="No data yet." />}</Card><Card><h3 className="mb-2 font-semibold">{tx('Status distribution')}</h3>{chart(status, 'value')}</Card><Card><h3 className="mb-2 font-semibold">{tx('Activity (last 14 days)')}</h3>{chart(trend, 'events', true)}</Card></div>
    <div className="mb-2 mt-6 flex items-center justify-between"><h3 className="font-semibold">{tx('Audit log')}</h3><Button variant="outline" size="sm" onClick={() => downloadCsv('audit-log.csv', [['Time', 'Event'], ...events.map((e) => [e.at, e.text])])}>{tx('Export audit log')}</Button></div>
    {events.length === 0 ? <Empty text="No events yet." /> : <Table head={['Time', 'Event']}>{events.slice(0, 60).map((e) => <tr key={e.id}><td className="whitespace-nowrap text-xs text-slate-500">{new Date(e.at).toLocaleString('id-ID')}</td><td>{e.text}</td></tr>)}</Table>}</>)
}
