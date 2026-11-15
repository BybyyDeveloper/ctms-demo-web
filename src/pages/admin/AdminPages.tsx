import { FormEvent, useState } from 'react'
import { tx } from '../../utils/i18n'
import { Link, useSearchParams } from 'react-router-dom'
import { Building2, CheckCircle2, CreditCard, Crown, GraduationCap, Pencil, Plus, ShieldCheck, Trash2, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { log, useApp } from '../../contexts/AppContext'
import { Company } from '../../types'
import { fmt, progressOf, uid } from '../../utils'
import { PLANS, idr, planOf } from '../../features/billing/plans'
import { Badge, Button, Card, Empty, Field, Input, Modal, PageHeader, Stat, Table } from '../../components/ui'
import { ActivityList } from '../../components/Shared'

const stats = (db: ReturnType<typeof useApp>['db']) => db.companies.map((c) => {
  const emp = db.users.filter((u) => u.role === 'user' && u.companyId === c.id), tr = db.trainings.filter((t) => t.companyId === c.id)
  const rows = db.assignments.filter((a) => tr.some((t) => t.id === a.trainingId)).map((a) => progressOf(db, a.userId, tr.find((t) => t.id === a.trainingId)!))
  return { name: c.name.replace('PT. ', ''), employees: emp.length, trainings: tr.length, completed: rows.filter((r) => r.status === 'Completed').length, assigned: rows.length, c }
})

export function Dashboard() {
  const { db } = useApp(), s = stats(db)
  return (<>
    <PageHeader title="Admin Dashboard" desc="Ringkasan seluruh platform." />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Stat icon={<Building2 />} label="Total Organizations" value={db.companies.length} /><Stat icon={<Users />} label="Total Users" value={db.users.filter((u) => u.role === 'user').length} />
      <Stat icon={<GraduationCap />} label="Total Trainings" value={db.trainings.length} tone="orange" /><Stat icon={<CheckCircle2 />} label="Active Organizations" value={db.companies.filter((c) => c.active).length} tone="green" />
    </div>
    <div className="mt-6 grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2"><h3 className="mb-3 font-semibold">{tx('Platform statistics per organization')}</h3><div className="h-64"><ResponsiveContainer><BarChart data={s}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip /><Legend />
        <Bar dataKey="employees" name={tx('Users')} fill="#2563eb" radius={[4, 4, 0, 0]} /><Bar dataKey="trainings" name={tx('Trainings')} fill="#818cf8" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
      <Card><h3 className="mb-2 font-semibold">{tx('Recent Activities')}</h3><ActivityList items={db.activities.slice(0, 7)} /></Card>
    </div></>)
}

export function Companies() {
  const { db, update } = useApp()
  const [edit, setEdit] = useState<Partial<Company> | null>(null), [err, setErr] = useState<Record<string, string>>({})
  const save = (e: FormEvent) => {
    e.preventDefault(); if (!edit) return
    const x: Record<string, string> = {}
    if (!edit.name?.trim()) x.name = 'Organization name is required'
    else if (db.companies.some((c) => c.id !== edit.id && c.name.toLowerCase() === edit.name!.trim().toLowerCase())) x.name = 'Organization already exists'
    setErr(x); if (Object.keys(x).length) return
    update((d) => {
      if (edit.id) { const c = d.companies.find((c) => c.id === edit.id)!; c.name = edit.name!.trim(); c.industry = edit.industry || 'General' }
      else { d.companies.push({ id: uid(), name: edit.name!.trim(), industry: edit.industry || 'General', active: true, createdAt: new Date().toISOString() }); log(d, `Company ${edit.name} was registered`) }
    }); setEdit(null)
  }
  const del = (c: Company) => {
    if (!confirm(tx('Delete {name} and all its users, trainings, and codes?', { name: c.name }))) return
    update((d) => {
      const tids = d.trainings.filter((t) => t.companyId === c.id).map((t) => t.id), uids = d.users.filter((u) => u.companyId === c.id).map((u) => u.id)
      d.companies = d.companies.filter((x) => x.id !== c.id); d.users = d.users.filter((u) => u.companyId !== c.id); d.trainings = d.trainings.filter((t) => t.companyId !== c.id)
      d.invites = d.invites.filter((i) => i.companyId !== c.id); d.categories = d.categories.filter((k) => k.companyId !== c.id); d.assignments = d.assignments.filter((a) => !tids.includes(a.trainingId))
      uids.forEach((id) => delete d.progress[id])
    })
  }
  return (<>
    <PageHeader title="Organizations" desc="Kelola organisasi terdaftar." action={<Button onClick={() => { setErr({}); setEdit({ name: '', industry: '' }) }}><Plus size={16} />{tx('Add organization')}</Button>} />
    <Table head={['Organization', 'Industry', 'Users', 'Created', 'Status', 'Plan', '']}>
      {db.companies.map((c) => <tr key={c.id}><td className="font-medium">{c.name}</td><td>{c.industry}</td><td>{db.users.filter((u) => u.role === 'user' && u.companyId === c.id).length}</td><td>{fmt(c.createdAt)}</td>
        <td><button onClick={() => update((d) => { const x = d.companies.find((y) => y.id === c.id)!; x.active = !x.active })}><Badge tone={c.active ? 'green' : 'red'}>{c.active ? tx('Active') : tx('Inactive')}</Badge></button></td><td><Badge tone={planOf(c) === 'pro' ? 'orange' : planOf(c) === 'premium' ? 'blue' : 'slate'}>{PLANS[planOf(c)].name}</Badge></td>
        <td className="space-x-1 text-right"><Button variant="ghost" size="icon" onClick={() => { setErr({}); setEdit(c) }}><Pencil size={15} /></Button><Button variant="ghost" size="icon" onClick={() => del(c)}><Trash2 size={15} className="text-red-600" /></Button></td></tr>)}
    </Table>
    {edit && <Modal title={edit.id ? tx('Edit organization') : tx('Add organization')} onClose={() => setEdit(null)}><form onSubmit={save} className="space-y-3" noValidate>
      <Field label="Organization name" error={err.name}><Input value={edit.name || ''} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
      <Field label="Industry"><Input value={edit.industry || ''} onChange={(e) => setEdit({ ...edit, industry: e.target.value })} /></Field><Button type="submit" className="w-full">{tx('Save')}</Button></form></Modal>}
  </>)
}

export function Employees() {
  const { db } = useApp(), [q, setQ] = useState('')
  const rows = db.users.filter((u) => u.role === 'user' && (u.name + u.email).toLowerCase().includes(q.toLowerCase()))
  return (<><PageHeader title="All Users" desc={tx('{n} users across all organizations', { n: rows.length })} action={<Input className="w-56" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />} />
    <Table head={['Name', 'Email', 'Position / Class', 'Organization']}>{rows.map((u) => <tr key={u.id}><td className="font-medium">{u.name}</td><td>{u.email}</td><td>{u.position || '-'}</td><td>{db.companies.find((c) => c.id === u.companyId)?.name || <Badge>{tx('Unassigned')}</Badge>}</td></tr>)}</Table></>)
}

export function Trainings() {
  const { db, update } = useApp(), [sp] = useSearchParams(), q = (sp.get('q') || '').toLowerCase()
  const rows = db.trainings.filter((t) => t.title.toLowerCase().includes(q))
  return (<><PageHeader title="All Trainings" desc={q ? `${tx('Search')}: "${q}"` : 'Training dari seluruh organisasi.'} />
    {rows.length === 0 ? <Empty text="No trainings found." /> : <Table head={['Training', 'Organization', 'Level', 'Modules', 'Deadline', 'Status', '']}>
      {rows.map((t) => <tr key={t.id}><td className="font-medium">{t.title}</td><td>{db.companies.find((c) => c.id === t.companyId)?.name}</td><td>{tx(t.level)}</td><td>{t.modules.length}</td><td>{fmt(t.deadline)}</td><td><Badge tone={t.status === 'published' ? 'green' : 'orange'}>{tx(t.status)}</Badge></td>
        <td className="text-right"><Button variant="ghost" size="icon" onClick={() => confirm(tx('Delete "{name}"?', { name: t.title })) && update((d) => { d.trainings = d.trainings.filter((x) => x.id !== t.id); d.assignments = d.assignments.filter((a) => a.trainingId !== t.id) })}><Trash2 size={15} className="text-red-600" /></Button></td></tr>)}</Table>}</>)
}

export function Reports() {
  const { db } = useApp(), s = stats(db)
  return (<><PageHeader title="Platform Reports" desc="Penyelesaian training per organisasi." />
    <Card className="mb-6"><div className="h-64"><ResponsiveContainer><BarChart data={s}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip /><Legend />
      <Bar dataKey="assigned" name={tx('Assignments')} fill="#94a3b8" radius={[4, 4, 0, 0]} /><Bar dataKey="completed" name={tx('Completed')} fill="#10b981" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
    <Table head={['Organization', 'Users', 'Trainings', 'Assignments', 'Completed', 'Rate']}>{s.map((r) => <tr key={r.c.id}><td className="font-medium">{r.c.name}</td><td>{r.employees}</td><td>{r.trainings}</td><td>{r.assigned}</td><td>{r.completed}</td><td>{r.assigned ? Math.round((r.completed / r.assigned) * 100) : 0}%</td></tr>)}</Table></>)
}

export function Subscriptions() {
  const { db } = useApp(), count = (p: 'free' | 'premium' | 'pro') => db.companies.filter((c) => planOf(c) === p).length
  const revenue = db.payments.reduce((a, p) => a + p.amount, 0)
  return (<><PageHeader title="Subscriptions" desc="All organization subscriptions and payments." />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat icon={<Building2 />} label="Free organizations" value={count('free')} /><Stat icon={<Crown />} label="Premium organizations" value={count('premium')} tone="green" /><Stat icon={<Crown />} label="Pro organizations" value={count('pro')} tone="orange" /><Stat icon={<CreditCard />} label="Total revenue (demo)" value={idr(revenue)} /></div>
    <h3 className="mb-2 mt-6 font-semibold">{tx('Organizations')}</h3>
    <Table head={['Organization', 'Plan', 'Valid until', 'Users']}>{db.companies.map((c) => <tr key={c.id}><td className="font-medium">{c.name}</td><td><Badge tone={planOf(c) === 'pro' ? 'orange' : planOf(c) === 'premium' ? 'blue' : 'slate'}>{PLANS[planOf(c)].name}</Badge></td><td>{planOf(c) === 'free' ? '-' : fmt(c.planUntil || '')}</td><td>{db.users.filter((u) => u.role === 'user' && u.companyId === c.id).length}</td></tr>)}</Table>
    <h3 className="mb-2 mt-6 font-semibold">{tx('Payment history')}</h3>
    {db.payments.length === 0 ? <Empty text="No payments yet." /> : <Table head={['Invoice', 'Organization', 'Plan', 'Amount', 'Date']}>{db.payments.map((p) => <tr key={p.id}><td className="font-mono text-xs">{p.invoice}</td><td>{db.companies.find((c) => c.id === p.companyId)?.name || '-'}</td><td>{PLANS[p.plan].name}</td><td>{idr(p.amount)}</td><td>{fmt(p.at)}</td></tr>)}</Table>}</>)
}

export function SettingsPage() {
  const { eraseAll } = useApp()
  const items = ['Passwords are hashed (PBKDF2) and never stored as plain text.', 'Login is rate-limited and sessions expire when idle.', 'Invitation codes are random, limited to one active code per organization, and revocable.', 'Links are restricted to http/https and uploads are limited to safe file types.']
  return (<><PageHeader title="Settings" /><div className="grid max-w-3xl gap-4">
    <Card className="space-y-2"><h3 className="flex items-center gap-2 font-semibold"><ShieldCheck size={18} />{tx('Security')}</h3><ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">{items.map((i) => <li key={i}>{tx(i)}</li>)}</ul>
      <p className="text-xs text-slate-400">{tx('All data is stored in a local database in this browser (IndexedDB). It is not shared between devices.')}</p></Card>
    <Card className="space-y-3"><h3 className="font-semibold">{tx('Erase all local data')}</h3><p className="text-sm text-slate-500">{tx('This permanently deletes every account, training, and uploaded file stored in this browser.')}</p>
      <Button variant="danger" onClick={() => { if (prompt(tx('Type DELETE to erase all data in this browser')) === 'DELETE') eraseAll() }}><Trash2 size={14} />{tx('Erase all local data')}</Button></Card></div></>)
}
