import { useState } from 'react'
import { tx } from '../../utils/i18n'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, Circle } from 'lucide-react'
import { log, useApp } from '../../contexts/AppContext'
import { mats, progressOf, statusTone } from '../../utils'
import { Badge, Button, Card, Empty, Progress, cn } from '../../components/ui'
import MaterialView from './MaterialView'

export default function Learning() {
  const { id } = useParams(), { db, me, update } = useApp()
  const t = db.trainings.find((x) => x.id === id && x.companyId === me!.companyId && db.assignments.some((a) => a.trainingId === x.id && a.userId === me!.id))
  const all = t ? mats(t) : [], p = db.progress[me!.id] || {}
  const [idx, setIdx] = useState(() => Math.max(0, all.findIndex((m) => !p[m.id])))
  if (!t || all.length === 0) return <Empty text="Training not available or has no materials." />
  const cur = all[Math.min(idx, all.length - 1)], pr = progressOf(db, me!.id, t), done = !!p[cur.id]
  const toggle = () => update((d) => {
    const x = (d.progress[me!.id] ||= {})
    if (x[cur.id]) delete x[cur.id]
    else { x[cur.id] = new Date().toISOString(); if (mats(t).every((m) => x[m.id])) log(d, `${me!.name} completed ${t.title}`, me!.companyId) }
  })
  return (<>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><Link to={`/user/trainings/${t.id}`} className="text-xs text-blue-600">{tx('← Back to detail')}</Link><h1 className="text-xl font-semibold text-navy-900">{t.title}</h1></div>
      <div className="w-56"><div className="mb-1 flex justify-between text-xs text-slate-500"><Badge tone={statusTone(pr.status)}>{tx(pr.status)}</Badge><span>{pr.pct}% · {pr.done}/{pr.total}</span></div><Progress value={pr.pct} /></div></div>
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      <Card className="max-h-[70vh] space-y-4 overflow-y-auto p-4">{t.modules.map((m) => <div key={m.id}><div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{m.title}</div>
        {m.materials.map((mt) => { const i = all.findIndex((a) => a.id === mt.id); return <button key={mt.id} onClick={() => setIdx(i)} className={cn('flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-slate-50', i === idx && 'bg-blue-50 font-medium text-blue-700')}>
          {p[mt.id] ? <CheckCircle2 size={16} className="shrink-0 text-emerald-500" /> : <Circle size={16} className="shrink-0 text-slate-300" />}{mt.title}</button> })}</div>)}</Card>
      <Card className="space-y-5"><div className="flex items-center justify-between"><div><div className="text-xs text-slate-500">{tx('Material {a} of {b}', { a: idx + 1, b: all.length })} · {tx(cur.type)}</div><h2 className="text-lg font-semibold text-navy-900">{cur.title}</h2></div><Badge tone={done ? 'green' : 'orange'}>{done ? tx('Completed') : tx('Pending')}</Badge></div>
        <MaterialView key={cur.id} m={cur} />
        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4"><Button variant="outline" disabled={idx === 0} onClick={() => setIdx(idx - 1)}><ArrowLeft size={16} />{tx('Previous')}</Button>
          <Button variant={done ? 'outline' : 'success'} onClick={toggle}><CheckCircle2 size={16} />{done ? tx('Mark as incomplete') : tx('Mark as Completed')}</Button>
          <Button disabled={idx >= all.length - 1} onClick={() => setIdx(idx + 1)}>{tx('Next')}<ArrowRight size={16} /></Button></div></Card></div></>)
}
