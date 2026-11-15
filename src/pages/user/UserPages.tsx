import { FormEvent, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Award, BookOpen, Building2, CheckCircle2, Clock, PlayCircle } from 'lucide-react'
import { log, useApp } from '../../contexts/AppContext'
import { fmt, ago, progressOf, statusTone } from '../../utils'
import { pwIssue } from '../../services/security'
import Certificate from '../../features/billing/Certificate'
import { can, planOf } from '../../features/billing/plans'
import { tx } from '../../utils/i18n'
import { Badge, Button, Card, Empty, Field, Input, PageHeader, Progress, Stat, Table, cn } from '../../components/ui'
import { ActivityList, CompanyLogo, TrainingCard } from '../../components/Shared'

function useMine() {
  const a = useApp(), me = a.me!
  const items = a.db.assignments.filter((x) => x.userId === me.id).map((x) => a.db.trainings.find((t) => t.id === x.trainingId && t.companyId === me.companyId && t.status === 'published')).filter((t) => !!t).map((t) => ({ t: t!, p: progressOf(a.db, me.id, t!) }))
  return { ...a, me, items }
}

function JoinCard() {
  const { join } = useMine(), [code, setCode] = useState(''), [err, setErr] = useState('')
  const submit = (e: FormEvent) => { e.preventDefault(); if (!code.trim()) return setErr('Enter the code'); setErr(join(code) || '') }
  return (<Card className="max-w-md"><h3 className="mb-1 font-semibold">{tx('Join an organization')}</h3><p className="mb-3 text-sm text-slate-500">{tx('Enter the unique code from your organization.')}</p>
    <form onSubmit={submit} className="flex items-start gap-2" noValidate><div className="flex-1"><Input placeholder="CTMS-XXXXXXXX" maxLength={16} autoComplete="off" value={code} onChange={(e) => setCode(e.target.value)} />{err && <div role="alert" className="mt-1 text-xs text-red-600">{tx(err)}</div>}</div><Button type="submit">{tx('Join')}</Button></form></Card>)
}

export function Dashboard() {
  const { me, company, items } = useMine()
  if (!company) return <><PageHeader title={tx('Welcome, {name} 👋', { name: me.name.split(' ')[0] })} desc="Gabung ke organisasi untuk melihat training Anda." /><JoinCard /></>
  const completed = items.filter((i) => i.p.status === 'Completed'), prog = items.filter((i) => i.p.status === 'In progress')
  const overall = items.length ? Math.round(items.reduce((s, i) => s + i.p.pct, 0) / items.length) : 0
  const upcoming = items.filter((i) => i.p.status !== 'Completed').sort((a, b) => a.t.deadline.localeCompare(b.t.deadline)).slice(0, 4)
  return (<><PageHeader title={tx('Welcome back, {name} 👋', { name: me.name.split(' ')[0] })} desc="Lanjutkan perjalanan belajar Anda." />
    <Card className="mb-4 flex items-center gap-4 bg-navy-900 text-white"><CompanyLogo c={company} className="h-12 w-12" /><div><div className="text-xs text-slate-300">{tx('Organization')}</div><div className="font-semibold">{company.name}</div><div className="text-xs text-slate-300">{company.industry} · {me.position || tx('User')}</div></div></Card>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat icon={<BookOpen />} label="My Trainings" value={items.length} /><Stat icon={<CheckCircle2 />} label="Completed" value={completed.length} tone="green" /><Stat icon={<PlayCircle />} label="In Progress" value={prog.length} tone="orange" /><Stat icon={<Award />} label="Learning Progress" value={`${overall}%`} /></div>
    <div className="mt-6 grid gap-4 lg:grid-cols-3"><Card className="lg:col-span-2"><h3 className="mb-3 font-semibold">{tx('Continue learning')}</h3>{items.length === 0 ? <Empty text="No trainings assigned yet." /> : <div className="space-y-4">{items.map(({ t, p }) => <Link key={t.id} to={`/user/trainings/${t.id}`} className="block"><div className="mb-1 flex justify-between text-sm"><span className="font-medium">{t.title}</span><Badge tone={statusTone(p.status)}>{tx(p.status)}</Badge></div><Progress value={p.pct} /></Link>)}</div>}</Card>
      <Card><h3 className="mb-2 font-semibold">{tx('Upcoming Deadlines')}</h3>{upcoming.length === 0 ? <p className="text-sm text-slate-500">{tx('All caught up 🎉')}</p> : <ul className="space-y-3">{upcoming.map(({ t }) => { const late = new Date(t.deadline) < new Date(); return <li key={t.id} className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><Clock size={14} />{t.title}</span><Badge tone={late ? 'red' : 'orange'}>{late ? tx('Overdue') : fmt(t.deadline)}</Badge></li> })}</ul>}</Card></div></>)
}

export function MyTrainings() {
  const { items, db } = useMine(), [sp] = useSearchParams(), q = (sp.get('q') || '').toLowerCase(), [f, setF] = useState('All')
  const rows = items.filter((i) => i.t.title.toLowerCase().includes(q) && (f === 'All' || i.p.status === f))
  return (<><PageHeader title="My Trainings" desc={q ? `${tx('Search')}: "${q}"` : 'Training yang ditugaskan kepada Anda.'} />
    <div className="mb-4 flex flex-wrap gap-2">{['All', 'Not started', 'In progress', 'Completed'].map((s) => <button key={s} onClick={() => setF(s)} className={cn('rounded-full border px-3 py-1 text-sm', f === s ? 'border-blue-600 bg-blue-600 text-white' : 'bg-white hover:bg-slate-50')}>{tx(s)}</button>)}</div>
    {rows.length === 0 ? <Empty text="No trainings match." /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{rows.map(({ t, p }) => <TrainingCard key={t.id} t={t} to={`/user/trainings/${t.id}`} pct={p.pct} status={p.status} tone={statusTone(p.status)} />)}</div>}
    <span className="hidden">{db.trainings.length}</span></>)
}

export function TrainingDetail() {
  const { id } = useParams(), { items, db, me, update, company } = useMine(), it = items.find((i) => i.t.id === id)
  const [ans, setAns] = useState<Record<number, number>>({}), [err, setErr] = useState(''), [cert, setCert] = useState(false)
  if (!it) return <Empty text="Training not found or not assigned to you." />
  const { t, p } = it, res = db.quizResults[`${me.id}:${t.id}`], cat = db.categories.find((c) => c.id === t.categoryId)
  const submit = () => {
    if (Object.keys(ans).length < t.quiz.length) return setErr('Answer all questions first'); setErr('')
    const score = t.quiz.filter((q, i) => ans[i] === q.answer).length
    update((d) => { d.quizResults[`${me.id}:${t.id}`] = { score, total: t.quiz.length, at: new Date().toISOString() }; log(d, `${me.name} scored ${score}/${t.quiz.length} on ${t.title} quiz`, me.companyId) })
  }
  return (<><Link to="/user/trainings" className="text-xs text-blue-600">{tx('← My Trainings')}</Link>
    <div className="mb-6 mt-2 flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-semibold text-navy-900">{t.title}</h1><p className="mt-1 max-w-2xl text-sm text-slate-500">{t.description}</p>
      <div className="mt-3 flex flex-wrap gap-2"><Badge tone="blue">{tx(t.level)}</Badge>{cat && <Badge>{cat.name}</Badge>}<Badge>{t.duration} {tx('min')}</Badge><Badge tone="orange">{tx('Due')} {fmt(t.deadline)}</Badge><Badge tone={statusTone(p.status)}>{tx(p.status)}</Badge></div></div>
      <div className="flex gap-2">{p.pct === 100 && can(planOf(company), 'certificate') && <Button variant="outline" className="h-10" onClick={() => setCert(true)}><Award size={16} />{tx('Certificate')}</Button>}<Link to={`/user/learn/${t.id}`}><Button className="h-10 px-5"><PlayCircle size={16} />{p.pct === 0 ? tx('Start learning') : p.pct === 100 ? tx('Review') : tx('Continue')}</Button></Link></div></div>
    <Card className="mb-4"><div className="mb-1 flex justify-between text-sm"><span>{tx('Progress')}</span><span>{p.pct}% ({p.done}/{p.total})</span></div><Progress value={p.pct} /></Card>
    <div className="grid gap-4 lg:grid-cols-2"><Card><h3 className="mb-2 font-semibold">{tx('Modules')}</h3>{t.modules.map((m, i) => <div key={m.id} className="border-b py-2 text-sm last:border-0"><b>{i + 1}. {m.title}</b><div className="text-xs text-slate-500">{m.materials.length} {tx('materials')}</div></div>)}</Card>
      <Card><h3 className="mb-2 font-semibold">{tx('Quiz')}</h3>{t.quiz.length === 0 ? <p className="text-sm text-slate-500">{tx('No quiz for this training.')}</p> : res ? <div className="space-y-2"><div className="text-3xl font-semibold text-navy-900">{res.score}/{res.total}</div><p className="text-sm text-slate-500">{tx('Submitted')} {ago(res.at)}</p><Button variant="outline" size="sm" onClick={() => update((d) => { delete d.quizResults[`${me.id}:${t.id}`] })}>{tx('Retake')}</Button></div>
        : <div className="space-y-4">{t.quiz.map((q, i) => <div key={i}><div className="mb-1 text-sm font-medium">{i + 1}. {q.q}</div>{q.options.map((o, oi) => <label key={oi} className="flex items-center gap-2 py-0.5 text-sm"><input type="radio" name={`q${i}`} checked={ans[i] === oi} onChange={() => setAns({ ...ans, [i]: oi })} />{o}</label>)}</div>)}{err && <div className="text-xs text-red-600">{tx(err)}</div>}<Button onClick={submit}>{tx('Submit quiz')}</Button></div>}</Card></div>{cert && <Certificate onClose={() => setCert(false)} c={{ name: me.name, title: t.title, org: company!.name, logo: can(planOf(company), 'branding') ? company!.logo : undefined, date: t.modules.flatMap((m) => m.materials).map((m) => db.progress[me.id]?.[m.id] || '').sort().pop() || new Date().toISOString(), signer: can(planOf(company), 'branding') ? company!.certSigner : undefined, signerTitle: company!.certTitle, no: `CERT-${t.id.slice(0, 4)}-${me.id.slice(0, 4)}`.toUpperCase() }} />}</>)
}

export function History() {
  const { items, db, me } = useMine()
  const rows = items.filter((i) => i.p.pct > 0).map((i) => { const times = i.t.modules.flatMap((m) => m.materials).map((m) => db.progress[me.id]?.[m.id]).filter(Boolean) as string[]; return { ...i, last: times.sort().pop() || '', quiz: db.quizResults[`${me.id}:${i.t.id}`] } }).sort((a, b) => b.last.localeCompare(a.last))
  return (<><PageHeader title="Training History" desc="Riwayat aktivitas belajar Anda." />{rows.length === 0 ? <Empty text="No learning history yet." /> :
    <Table head={['Training', 'Last activity', 'Progress', 'Quiz', 'Status']}>{rows.map(({ t, p, last, quiz }) => <tr key={t.id}><td className="font-medium">{t.title}</td><td>{fmt(last)}</td><td className="w-40"><Progress value={p.pct} /></td><td>{quiz ? `${quiz.score}/${quiz.total}` : '-'}</td><td><Badge tone={statusTone(p.status)}>{tx(p.status)}</Badge></td></tr>)}</Table>}</>)
}

export function Profile() {
  const { me, company, update, setPassword } = useMine(), [name, setName] = useState(me.name), [pos, setPos] = useState(me.position || ''), [pw, setPw] = useState(''), [err, setErr] = useState<Record<string, string>>({}), [ok, setOk] = useState(false)
  const save = async (e: FormEvent) => {
    e.preventDefault(); const x: Record<string, string> = {}
    if (name.trim().length < 2) x.name = 'Name is required'
    const pi = pw ? pwIssue(pw) : null; if (pi) x.pw = pi
    setErr(x); if (Object.keys(x).length) return
    update((d) => { const u = d.users.find((y) => y.id === me.id)!; u.name = name.trim(); u.position = pos })
    if (pw) await setPassword(me.id, pw)
    setPw(''); setOk(true); setTimeout(() => setOk(false), 1500)
  }
  return (<><PageHeader title="Profile" /><div className="grid gap-4 lg:grid-cols-2"><Card><form onSubmit={save} className="space-y-3" noValidate><Field label="Email"><Input value={me.email} disabled /></Field><Field label="Name" error={err.name}><Input value={name} onChange={(e) => setName(e.target.value)} /></Field><Field label="Position / Class"><Input value={pos} onChange={(e) => setPos(e.target.value)} /></Field><Field label="New password (optional)" error={err.pw}><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></Field><Button type="submit">{ok ? tx('Saved ✓') : tx('Save changes')}</Button></form></Card>
    <div className="space-y-4">{company ? <Card><div className="text-xs text-slate-500">{tx('Organization')}</div><div className="font-semibold">{company.name}</div><Button className="mt-3" variant="outline" size="sm" onClick={() => confirm(tx('Leave this organization?')) && update((d) => { d.users.find((y) => y.id === me.id)!.companyId = undefined })}>{tx('Leave organization')}</Button></Card> : <JoinCard />}</div></div></>)
}

export function Notifications() {
  const { db, me } = useMine()
  const list = db.activities.filter((a) => a.companyId === me.companyId && (!a.userId || a.userId === me.id))
  return (<><PageHeader title="Notifications" /><Card><ActivityList items={list} /></Card></>)
}
