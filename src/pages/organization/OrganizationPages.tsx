import { ChangeEvent, FormEvent, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Clock, Copy, GraduationCap, Info, Pencil, Plus, ShieldOff, Trash2, Upload, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { audit, log, useApp } from '../../contexts/AppContext'
import { PLANS, can, downloadCsv, planOf } from '../../features/billing/plans'
import CertSettings from '../../features/billing/CertSettings'
import { useUpsell } from '../../components/Upsell'
import { Lock } from 'lucide-react'
import { User } from '../../types'
import { IMG_OK, fmt, genCode, progressOf, resizeImage, uid } from '../../utils'
import { hashPassword, pwIssue } from '../../services/security'
import { useToast } from '../../components/Toast'
import { tx } from '../../utils/i18n'
import { Badge, Button, Card, Empty, Field, Input, Modal, PageHeader, Progress, Select, Stat, Table } from '../../components/ui'
import { ActivityList, CompanyLogo, TrainingCard } from '../../components/Shared'

function useCo() {
  const a = useApp(), cid = a.me!.companyId!
  const employees = a.db.users.filter((u) => u.role === 'user' && u.companyId === cid)
  const trainings = a.db.trainings.filter((t) => t.companyId === cid)
  const asg = a.db.assignments.filter((x) => trainings.some((t) => t.id === x.trainingId))
  const rows = asg.map((x) => ({ a: x, t: trainings.find((t) => t.id === x.trainingId)!, u: employees.find((u) => u.id === x.userId), p: progressOf(a.db, x.userId, trainings.find((t) => t.id === x.trainingId)!) })).filter((r) => r.u)
  return { ...a, cid, employees, trainings, rows }
}

export function Dashboard() {
  const { db, cid, employees, trainings, rows, company } = useCo()
  const completed = rows.filter((r) => r.p.status === 'Completed').length
  const data = employees.map((e) => { const r = rows.filter((x) => x.u!.id === e.id); return { name: e.name.split(' ')[0], progress: r.length ? Math.round(r.reduce((s, x) => s + x.p.pct, 0) / r.length) : 0 } })
  return (<><PageHeader title={company?.name || 'Organization'} desc="Organization dashboard" action={<CompanyLogo c={company} className="h-12 w-12" />} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat icon={<Users />} label="Total Users" value={employees.length} /><Stat icon={<GraduationCap />} label="Total Trainings" value={trainings.length} />
      <Stat icon={<CheckCircle2 />} label="Completed Trainings" value={completed} tone="green" /><Stat icon={<Clock />} label="Pending Trainings" value={rows.length - completed} tone="orange" /></div>
    <div className="mt-6 grid gap-4 lg:grid-cols-3"><Card className="lg:col-span-2"><h3 className="mb-3 font-semibold">{tx('User Progress (avg %)')}</h3><div className="h-64"><ResponsiveContainer><BarChart data={data}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" fontSize={12} /><YAxis domain={[0, 100]} fontSize={12} /><Tooltip /><Bar dataKey="progress" name={tx('Progress')} fill="#2563eb" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
      <Card><h3 className="mb-2 font-semibold">{tx('Recent Training Activities')}</h3><ActivityList items={db.activities.filter((a) => a.companyId === cid && !a.userId).slice(0, 7)} /></Card></div></>)
}

export function Employees() {
  const { db, update, cid, employees, company } = useCo(), upsell = useUpsell()
  const [e, setE] = useState<(Partial<User> & { password?: string }) | null>(null), [err, setErr] = useState<Record<string, string>>({})
  const save = async (ev: FormEvent) => {
    ev.preventDefault(); if (!e) return
    const x: Record<string, string> = {}
    if (!e.name?.trim()) x.name = 'Name is required'
    if (!/^\S+@\S+\.\S+$/.test(e.email || '')) x.email = 'Enter a valid email'
    else if (db.users.some((u) => u.id !== e.id && u.email.toLowerCase() === e.email!.toLowerCase())) x.email = 'Email already used'
    if ((!e.id || e.password) && pwIssue(e.password || '')) x.password = pwIssue(e.password || '')!
    setErr(x); if (Object.keys(x).length) return
    const ul = PLANS[planOf(company)].users
    if (!e.id && employees.length >= ul) { setE(null); return upsell('You have reached the user limit of your plan ({n}). Upgrade to add more users.', { n: ul }) }
    const pw = e.password ? await hashPassword(e.password) : ''
    update((d) => {
      if (e.id) { const u = d.users.find((u) => u.id === e.id && u.companyId === cid)!; u.name = e.name!.trim(); u.email = e.email!.trim(); u.position = e.position; if (pw) { u.pw = pw; u.mustChange = true } }
      else { d.users.push({ id: uid(), name: e.name!.trim(), email: e.email!.trim(), pw, mustChange: true, role: 'user', companyId: cid, position: e.position, createdAt: new Date().toISOString() }); log(d, `${e.name} was added as user`, cid); audit(d, `User added: ${e.name}`, cid) }
    }); setE(null)
  }
  return (<><PageHeader title="Users" desc={tx('{n} users', { n: employees.length })} action={<Button onClick={() => { setErr({}); setE({ name: '', email: '', password: '', position: '' }) }}><Plus size={16} />{tx('Add user')}</Button>} />
    {employees.length === 0 ? <Empty text="No users yet." /> : <Table head={['Name', 'Email', 'Position / Class', '']}>{employees.map((u) => <tr key={u.id}><td className="font-medium">{u.name}</td><td>{u.email}</td><td>{u.position || '-'}</td>
      <td className="space-x-1 text-right"><Button variant="ghost" size="icon" onClick={() => { setErr({}); setE({ ...u, password: '' }) }}><Pencil size={15} /></Button>
        <Button variant="ghost" size="icon" onClick={() => confirm(tx('Remove {name}?', { name: u.name })) && update((d) => { d.users = d.users.filter((x) => x.id !== u.id); d.assignments = d.assignments.filter((a) => a.userId !== u.id); delete d.progress[u.id] })}><Trash2 size={15} className="text-red-600" /></Button></td></tr>)}</Table>}
    {e && <Modal title={e.id ? tx('Edit user') : tx('Add user')} onClose={() => setE(null)}><form onSubmit={save} className="space-y-3" noValidate>
      <Field label="Name" error={err.name}><Input value={e.name || ''} onChange={(v) => setE({ ...e, name: v.target.value })} /></Field><Field label="Email" error={err.email}><Input value={e.email || ''} onChange={(v) => setE({ ...e, email: v.target.value })} /></Field>
      <Field label={e.id ? 'New password (optional)' : 'Temporary password'} error={err.password}><Input type="password" value={e.password || ''} onChange={(v) => setE({ ...e, password: v.target.value })} /></Field>
      <Field label="Position / Class"><Input value={e.position || ''} onChange={(v) => setE({ ...e, position: v.target.value })} /></Field><Button type="submit" className="w-full">{tx('Save')}</Button></form></Modal>}</>)
}

export function Codes() {
  const { db, update, cid } = useCo(), toast = useToast()
  const list = db.invites.filter((i) => i.companyId === cid).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const active = list.find((i) => i.active), old = list.filter((i) => !i.active)
  const copy = async () => { try { await navigator.clipboard.writeText(active!.code); toast('Code copied to clipboard', 'success') } catch { toast('Copy failed', 'error') } }
  const generate = () => {
    if (active) return toast('Revoke the current code before generating a new one.', 'error')
    update((d) => { if (d.invites.some((i) => i.companyId === cid && i.active)) return; let code = genCode(); while (d.invites.some((i) => i.code === code)) code = genCode(); d.invites.unshift({ id: uid(), companyId: cid, code, active: true, createdAt: new Date().toISOString() }); log(d, 'Invitation code generated', cid); audit(d, 'Invitation code generated', cid) })
    toast('New code generated. Share it only with people who should join.', 'success')
  }
  const revoke = () => {
    if (!active || !confirm(tx('Revoke the current code? New users can no longer join with it. Current members are not affected.'))) return
    update((d) => { const i = d.invites.find((x) => x.id === active.id && x.companyId === cid); if (i) { i.active = false; i.revokedAt = new Date().toISOString(); log(d, 'Invitation code revoked', cid); audit(d, 'Invitation code revoked', cid) } })
    toast('Code revoked. You can now generate a new one.', 'success')
  }
  return (<><PageHeader title="Invitation Codes" desc="Share a code so users can join." />
    <div className="mb-4 flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700"><Info size={16} className="mt-0.5 shrink-0" />{tx('Each organization can have only one active code. To create a new one, revoke the current code first.')}</div>
    <Card className="mb-6">{active ? <>
      <div className="flex flex-wrap items-center justify-between gap-4"><div><div className="text-xs text-slate-500">{tx('Your active code')}</div><div className="font-mono text-2xl font-semibold tracking-wider text-navy-900">{active.code}</div><div className="text-xs text-slate-400">{tx('Created')} {fmt(active.createdAt)}</div></div>
        <div className="flex gap-2"><Button variant="outline" onClick={copy}><Copy size={14} />{tx('Copy')}</Button><Button variant="danger" onClick={revoke}><ShieldOff size={14} />{tx('Revoke code')}</Button></div></div>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3"><Button size="sm" variant="outline" className="opacity-60" aria-disabled onClick={generate}><Plus size={14} />{tx('Generate new code')}</Button><span className="text-xs text-slate-500">{tx('Revoke the current code before generating a new one.')}</span></div></>
      : <div className="flex flex-wrap items-center justify-between gap-3"><div className="font-medium">{tx('No active code')}</div><Button onClick={generate}><Plus size={16} />{tx('Generate new code')}</Button></div>}</Card>
    {old.length > 0 && <><h3 className="mb-2 font-semibold">{tx('Code history')}</h3><Table head={['Code', 'Created', 'Status', 'Revoked on']}>{old.map((i) => <tr key={i.id}><td className="font-mono">{i.code.slice(0, 7)}••••••</td><td>{fmt(i.createdAt)}</td><td><Badge tone="red">{tx('Revoked')}</Badge></td><td>{fmt(i.revokedAt || '')}</td></tr>)}</Table></>}</>)
}

export function Trainings() {
  const { db, update, trainings } = useCo(), [sp] = useSearchParams(), q = (sp.get('q') || '').toLowerCase()
  const rows = trainings.filter((t) => t.title.toLowerCase().includes(q))
  return (<><PageHeader title="Trainings" desc={q ? `${tx('Search')}: "${q}"` : tx('{n} trainings', { n: trainings.length })} action={<Link to="/organization/trainings/new"><Button><Plus size={16} />{tx('Create training')}</Button></Link>} />
    {rows.length === 0 ? <Empty text="No trainings found." /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{rows.map((t) => <div key={t.id} className="space-y-2"><TrainingCard t={t} to={`/organization/trainings/${t.id}/edit`} status={t.status} tone={t.status === 'published' ? 'green' : 'orange'} />
      <div className="flex gap-2"><span className="flex-1 text-xs text-slate-500">{db.categories.find((c) => c.id === t.categoryId)?.name || tx('Uncategorized')} · {t.modules.length} {tx('modules')}</span>
        <Link to={`/organization/trainings/${t.id}/edit`}><Button variant="outline" size="sm"><Pencil size={13} />{tx('Edit')}</Button></Link>
        <Button variant="outline" size="sm" onClick={() => confirm(tx('Delete "{name}"?', { name: t.title })) && update((d) => { d.trainings = d.trainings.filter((x) => x.id !== t.id); d.assignments = d.assignments.filter((a) => a.trainingId !== t.id) })}><Trash2 size={13} className="text-red-600" /></Button></div></div>)}</div>}</>)
}

export function Categories() {
  const { db, update, cid } = useCo(), [name, setName] = useState(''), [err, setErr] = useState('')
  const list = db.categories.filter((c) => c.companyId === cid)
  const add = (e: FormEvent) => { e.preventDefault(); const n = name.trim(); if (!n) return setErr('Category name is required'); if (list.some((c) => c.name.toLowerCase() === n.toLowerCase())) return setErr('Category already exists'); setErr(''); setName(''); update((d) => { d.categories.push({ id: uid(), companyId: cid, name: n }) }) }
  return (<><PageHeader title="Categories" desc="Kelompokkan training." />
    <Card className="max-w-xl"><form onSubmit={add} className="mb-4 flex items-start gap-2" noValidate><div className="flex-1"><Input placeholder="New category…" value={name} onChange={(e) => setName(e.target.value)} />{err && <div className="mt-1 text-xs text-red-600">{tx(err)}</div>}</div><Button type="submit"><Plus size={16} />{tx('Add')}</Button></form>
      <ul className="divide-y">{list.map((c) => <li key={c.id} className="flex items-center gap-2 py-2 text-sm"><input className="flex-1 rounded border border-transparent px-2 py-1 hover:border-slate-200 focus:border-blue-500 focus:outline-none" defaultValue={c.name} onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== c.name) update((d) => { d.categories.find((x) => x.id === c.id)!.name = v }); else e.target.value = c.name }} />
        <Badge>{db.trainings.filter((t) => t.categoryId === c.id).length} {tx('trainings')}</Badge><Button variant="ghost" size="icon" onClick={() => update((d) => { d.categories = d.categories.filter((x) => x.id !== c.id); d.trainings.forEach((t) => { if (t.categoryId === c.id) t.categoryId = '' }) })}><Trash2 size={15} className="text-red-600" /></Button></li>)}</ul>
      <p className="mt-2 text-xs text-slate-400">{tx('Klik nama untuk mengedit, lalu klik di luar untuk menyimpan.')}</p></Card></>)
}

export function Assignments() {
  const { update, cid, employees, trainings, rows } = useCo()
  const [tid, setTid] = useState(''), [sel, setSel] = useState<string[]>([]), [err, setErr] = useState('')
  const toggle = (id: string) => setSel(sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id])
  const assign = () => {
    if (!tid) return setErr('Select a training'); if (!sel.length) return setErr('Select at least one user'); setErr('')
    const t = trainings.find((x) => x.id === tid)!
    update((d) => { sel.forEach((u) => { if (!d.assignments.some((a) => a.userId === u && a.trainingId === tid)) { d.assignments.push({ id: uid(), userId: u, trainingId: tid }); log(d, `You were assigned "${t.title}"`, cid, u) } }); log(d, `Training "${t.title}" assigned to ${sel.length} employees`, cid) }); setSel([])
  }
  return (<><PageHeader title="Assignments" desc="Berikan training kepada pengguna." />
    <div className="grid gap-4 lg:grid-cols-3"><Card className="space-y-3"><Field label="Training"><Select value={tid} onChange={(e) => setTid(e.target.value)}><option value="">{tx('Select training…')}</option>{trainings.filter((t) => t.status === 'published').map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</Select></Field>
      <div className="flex items-center justify-between text-xs font-medium text-slate-600">{tx('Users')}<button className="text-blue-600" onClick={() => setSel(sel.length === employees.length ? [] : employees.map((e) => e.id))}>{tx('Toggle all')}</button></div>
      <div className="max-h-56 space-y-1 overflow-y-auto">{employees.map((e) => <label key={e.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sel.includes(e.id)} onChange={() => toggle(e.id)} />{e.name}</label>)}</div>
      {err && <div className="text-xs text-red-600">{tx(err)}</div>}<Button className="w-full" onClick={assign}>{tx('Assign')}</Button></Card>
      <div className="lg:col-span-2">{rows.length === 0 ? <Empty text="No assignments yet." /> : <Table head={['User', 'Training', 'Progress', '']}>{rows.map((r) => <tr key={r.a.id}><td>{r.u!.name}</td><td>{r.t.title}</td><td className="w-40"><Progress value={r.p.pct} /></td>
        <td className="text-right"><Button variant="ghost" size="icon" onClick={() => update((d) => { d.assignments = d.assignments.filter((x) => x.id !== r.a.id) })}><Trash2 size={15} className="text-red-600" /></Button></td></tr>)}</Table>}</div></div></>)
}

export function Reports() {
  const { trainings, rows, employees, company } = useCo(), plan = planOf(company), upsell = useUpsell()
  const per = trainings.map((t) => { const r = rows.filter((x) => x.t.id === t.id); return { name: t.title.split(' ').slice(0, 2).join(' '), title: t.title, assigned: r.length, completed: r.filter((x) => x.p.status === 'Completed').length, avg: r.length ? Math.round(r.reduce((s, x) => s + x.p.pct, 0) / r.length) : 0 } })
  const avgOf = (r: typeof rows) => (r.length ? Math.round(r.reduce((s, x) => s + x.p.pct, 0) / r.length) : 0)
  const exp = (kind: 'training' | 'user') => {
    if (!can(plan, 'export')) return upsell('CSV export is available on Premium and Pro plans.')
    if (kind === 'training') downloadCsv('training-report.csv', [['Training', 'Assigned', 'Completed', 'Avg progress %'], ...per.map((r) => [r.title, String(r.assigned), String(r.completed), String(r.avg)])])
    else downloadCsv('user-report.csv', [['Name', 'Email', 'Assigned', 'Completed', 'Avg progress %'], ...employees.map((e) => { const r = rows.filter((x) => x.u!.id === e.id); return [e.name, e.email, String(r.length), String(r.filter((x) => x.p.status === 'Completed').length), String(avgOf(r))] })])
  }
  const lock = !can(plan, 'export') && <Lock size={13} />
  return (<><PageHeader title="Training Reports" desc="Penyelesaian per training dan per pengguna." action={<div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => exp('training')}>{lock}{tx('Export by training')}</Button><Button variant="outline" size="sm" onClick={() => exp('user')}>{lock}{tx('Export by user')}</Button></div>} />
    <Card className="mb-6"><div className="h-64"><ResponsiveContainer><BarChart data={per}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" fontSize={11} /><YAxis domain={[0, 100]} fontSize={12} /><Tooltip /><Bar dataKey="avg" name={tx('Avg progress %')} fill="#2563eb" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
    <h3 className="mb-2 font-semibold">{tx('By training')}</h3><Table head={['Training', 'Assigned', 'Completed', 'Avg progress']}>{per.map((r) => <tr key={r.title}><td className="font-medium">{r.title}</td><td>{r.assigned}</td><td>{r.completed}</td><td>{r.avg}%</td></tr>)}</Table>
    <h3 className="mb-2 mt-6 font-semibold">{tx('By user')}</h3><Table head={['User', 'Assigned', 'Completed', 'Avg progress']}>{employees.map((e) => { const r = rows.filter((x) => x.u!.id === e.id); return <tr key={e.id}><td className="font-medium">{e.name}</td><td>{r.length}</td><td>{r.filter((x) => x.p.status === 'Completed').length}</td><td>{r.length ? Math.round(r.reduce((s, x) => s + x.p.pct, 0) / r.length) : 0}%</td></tr> })}</Table></>)
}

export function SettingsPage() {
  const { company, update } = useCo(), [name, setName] = useState(company?.name || ''), [ind, setInd] = useState(company?.industry || ''), [err, setErr] = useState(''), [ok, setOk] = useState(false), [lerr, setLerr] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  const save = (e: FormEvent) => { e.preventDefault(); if (!name.trim()) return setErr('Organization name is required'); setErr(''); update((d) => { const c = d.companies.find((x) => x.id === company!.id)!; c.name = name.trim(); c.industry = ind }); setOk(true); setTimeout(() => setOk(false), 1500) }
  const pick = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = ''
    if (!f) return
    if (!IMG_OK.includes(f.type)) return setLerr('File type not allowed')
    try { const data = await resizeImage(f, 256); update((d) => { d.companies.find((x) => x.id === company!.id)!.logo = data }); setLerr('') } catch { setLerr('Upload failed. Browser storage may be full or blocked.') }
  }
  return (<><PageHeader title="Settings" /><div className="grid max-w-3xl gap-4 md:grid-cols-2">
    <Card className="md:col-span-2"><h3 className="mb-3 font-semibold">{tx('Organization photo / logo')}</h3><div className="flex flex-wrap items-center gap-4"><CompanyLogo c={company} className="h-20 w-20 text-2xl" />
      <div className="space-y-2"><div className="flex gap-2"><Button variant="outline" onClick={() => ref.current?.click()}><Upload size={14} />{tx('Upload photo')}</Button>{company?.logo && <Button variant="ghost" onClick={() => update((d) => { delete d.companies.find((x) => x.id === company.id)!.logo })}>{tx('Remove')}</Button>}</div><p className="text-xs text-slate-500">{tx('JPG/PNG, resized automatically.')}</p>{lerr && <div className="text-xs text-red-600">{tx(lerr)}</div>}</div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={pick} /></div></Card>
    <Card><form onSubmit={save} className="space-y-3" noValidate><h3 className="font-semibold">{tx('Organization profile')}</h3><Field label="Name" error={err}><Input value={name} onChange={(e) => setName(e.target.value)} /></Field><Field label="Industry"><Input value={ind} onChange={(e) => setInd(e.target.value)} /></Field><Button type="submit">{ok ? tx('Saved ✓') : tx('Save')}</Button></form></Card>
    <CertSettings />
    <Card className="space-y-2"><h3 className="font-semibold">{tx('Security')}</h3><p className="text-sm text-slate-500">{tx('Data is stored locally in this browser. Never reuse a password from another service.')}</p></Card></div></>)
}
