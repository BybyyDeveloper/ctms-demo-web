import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, GraduationCap, KeyRound, ShieldCheck, Users } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { Role } from '../../types'
import { pwIssue } from '../../services/security'
import { tx } from '../../utils/i18n'
import { Badge, Button, Card, Field, Input, Select } from '../../components/ui'
import Prefs from '../../components/Prefs'

export function Landing() {
  const feats = [[Users, 'Role-based dashboards', 'Admin, Organization, and User each get their own workspace.'], [KeyRound, 'Organization invitation codes', 'Users join with one unique, revocable code.'], [GraduationCap, 'LMS & quizzes', 'Modules, materials, videos, documents, checklists, and quizzes.'], [BarChart3, 'Progress reports', 'Track training completion in real time.']] as const
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5"><div className="flex items-center gap-2 font-semibold text-navy-900"><div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white"><GraduationCap size={18} /></div>CTMS</div>
        <div className="flex items-center gap-2"><Prefs /><Link to="/login"><Button variant="ghost">{tx('Login')}</Button></Link><Link to="/register"><Button>{tx('Get started')}</Button></Link></div></header>
      <section className="bg-gradient-to-br from-navy-900 via-navy-800 to-indigo-900 text-white"><div className="mx-auto max-w-6xl px-4 py-20 text-center"><Badge tone="blue">{tx('Local database · data stays in your browser')}</Badge>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">{tx('Manage training for organizations, schools, and campuses')}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-slate-300">{tx('Create training guides, share them with users through a unique code, and track learning progress in one platform.')}</p>
        <div className="mt-8 flex justify-center gap-3"><Link to="/register"><Button className="h-11 px-6">{tx('Get started')}</Button></Link><Link to="/login"><Button variant="outline" className="h-11 px-6">{tx('Login')}</Button></Link></div></div></section>
      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-16 sm:grid-cols-2 lg:grid-cols-4">{feats.map(([I, t, d]) => <Card key={t}><I className="mb-3 text-blue-600" /><h3 className="font-semibold text-navy-900">{tx(t)}</h3><p className="mt-1 text-sm text-slate-500">{tx(d)}</p></Card>)}</section>
      <section className="mx-auto max-w-3xl px-4 pb-20"><Card className="flex items-start gap-3"><ShieldCheck className="shrink-0 text-emerald-600" /><p className="text-sm text-slate-600">{tx('Passwords are hashed (PBKDF2) and never stored as plain text.')} {tx('Login is rate-limited and sessions expire when idle.')}</p></Card></section>
    </div>
  )
}

const AuthShell = ({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) => (
  <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy-900 via-navy-800 to-indigo-900 p-4"><div className="fixed right-4 top-4"><Prefs dark /></div><div className="w-full max-w-md">
    <Link to="/" className="mb-6 flex items-center justify-center gap-2 font-semibold text-white"><GraduationCap />CTMS</Link>
    <Card className="p-7 shadow-xl"><div className="mb-1 flex items-center justify-between gap-2"><h1 className="text-xl font-semibold text-navy-900">{tx(title)}</h1><Badge tone="blue">{tx('Local Mode')}</Badge></div><p className="mb-5 text-sm text-slate-500">{tx(sub)}</p>{children}</Card>
    <p className="mt-4 text-center text-xs text-slate-300">{tx('Data is stored locally in this browser. Never reuse a password from another service.')}</p></div></div>
)
const emailOk = (s: string) => /^\S+@\S+\.\S+$/.test(s) && s.length <= 120
const Err = ({ text }: { text: string }) => text ? <div role="alert" className="rounded-md bg-red-50 p-2 text-sm text-red-700">{tx(text)}</div> : null

export function Login() {
  const { login, db } = useApp()
  const [email, setEmail] = useState(''), [pw, setPw] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  const [fe, setFe] = useState<{ email?: string; pw?: string }>({})
  const [notice] = useState(() => sessionStorage.getItem('ctms_notice') || '')
  useEffect(() => { sessionStorage.removeItem('ctms_notice') }, [])
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const f: typeof fe = {}
    if (!emailOk(email)) f.email = 'Enter a valid email'
    if (!pw) f.pw = 'Enter your password'
    setFe(f); if (Object.keys(f).length) return
    setBusy(true); setErr((await login(email, pw)) || ''); setBusy(false)
  }
  return (
    <AuthShell title="Welcome back" sub="Login to continue to your dashboard.">
      {db.users.length === 0 && <div className="mb-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">{tx('This is a fresh installation. The first account you create becomes the Administrator.')} <Link className="font-medium underline" to="/register">{tx('Set up now')}</Link></div>}
      {notice && <div className="mb-4 rounded-xl bg-orange-50 p-3 text-sm text-orange-700">{tx(notice)}</div>}
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Email" error={fe.email}><Input type="email" autoComplete="username" maxLength={120} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></Field>
        <Field label="Password" error={fe.pw}><Input type="password" autoComplete="current-password" maxLength={128} value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
        <Err text={err} />
        <Button className="w-full" type="submit" disabled={busy}>{tx('Login')}</Button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">{tx('No account?')} <Link className="text-blue-600" to="/register">{tx('Register')}</Link></p>
    </AuthShell>
  )
}

export function Register() {
  const { register, db } = useApp(), first = db.users.length === 0
  const [f, setF] = useState({ name: '', email: '', password: '', confirm: '', role: 'user' as Role, companyName: '' })
  const [fe, setFe] = useState<Record<string, string>>({}), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  const set = (k: string, v: string) => setF({ ...f, [k]: v })
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const x: Record<string, string> = {}
    if (f.name.trim().length < 2) x.name = 'Name is required'
    if (!emailOk(f.email)) x.email = 'Enter a valid email'
    const p = pwIssue(f.password); if (p) x.password = p
    else if (f.password !== f.confirm) x.confirm = 'Passwords do not match'
    if (f.role === 'organization' && !first && f.companyName.trim().length < 2) x.companyName = 'Organization name is required'
    setFe(x); if (Object.keys(x).length) return
    setBusy(true); const r = await register(f); setBusy(false); if (r) setErr(r)
  }
  return (
    <AuthShell title={first ? 'Setup: create the administrator account' : 'Create account'} sub={first ? 'This is a fresh installation. The first account you create becomes the Administrator.' : 'Create your account to get started.'}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {!first && <Field label="Role"><Select value={f.role} onChange={(e) => set('role', e.target.value)}><option value="user">{tx('User')}</option><option value="organization">{tx('Organization')}</option></Select></Field>}
        <Field label="Full name" error={fe.name}><Input maxLength={80} value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
        {f.role === 'organization' && !first && <Field label="Organization name" error={fe.companyName}><Input maxLength={80} value={f.companyName} onChange={(e) => set('companyName', e.target.value)} /></Field>}
        <Field label="Email" error={fe.email}><Input type="email" autoComplete="username" maxLength={120} value={f.email} onChange={(e) => set('email', e.target.value)} /></Field>
        <Field label="Password" error={fe.password}><Input type="password" autoComplete="new-password" maxLength={128} value={f.password} onChange={(e) => set('password', e.target.value)} /></Field>
        <Field label="Confirm password" error={fe.confirm}><Input type="password" autoComplete="new-password" maxLength={128} value={f.confirm} onChange={(e) => set('confirm', e.target.value)} /></Field>
        <Err text={err} />
        <Button className="w-full" type="submit" disabled={busy}>{tx(first ? 'Create administrator' : 'Create account')}</Button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">{tx('Already registered?')} <Link className="text-blue-600" to="/login">{tx('Login')}</Link></p>
    </AuthShell>
  )
}
