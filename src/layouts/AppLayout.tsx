import { useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Bell, BookOpen, Building2, ChevronLeft, ChevronRight, FolderTree, GraduationCap, History, KeyRound, LayoutDashboard, LogOut, Menu, Search, Settings, UserCircle, Users, BarChart3, ClipboardList, PlusCircle } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { Role } from '../types'
import { ago } from '../utils'
import { Badge, cn } from '../components/ui'
import Prefs from '../components/Prefs'
import { CreditCard, Crown, LineChart as AnalyticsIcon } from 'lucide-react'
import { PLANS, planOf } from '../features/billing/plans'
import { CompanyLogo } from '../components/Shared'
import { tx } from '../utils/i18n'

const nav: Record<Role, { to: string; label: string; icon: typeof Bell; end?: boolean; pro?: boolean }[]> = {
  admin: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true }, { to: '/admin/companies', label: 'Organizations', icon: Building2 }, { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/trainings', label: 'Trainings', icon: GraduationCap }, { to: '/admin/reports', label: 'Reports', icon: BarChart3 }, { to: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard }, { to: '/admin/settings', label: 'Settings', icon: Settings },
  ],
  organization: [
    { to: '/organization', label: 'Dashboard', icon: LayoutDashboard, end: true }, { to: '/organization/subscription', label: 'Subscription', icon: Crown }, { to: '/organization/users', label: 'Users', icon: Users }, { to: '/organization/codes', label: 'Invitation Codes', icon: KeyRound },
    { to: '/organization/trainings', label: 'Trainings', icon: GraduationCap, end: true }, { to: '/organization/trainings/new', label: 'Create Training', icon: PlusCircle }, { to: '/organization/categories', label: 'Categories', icon: FolderTree },
    { to: '/organization/assignments', label: 'Assignments', icon: ClipboardList }, { to: '/organization/reports', label: 'Reports', icon: BarChart3 }, { to: '/organization/analytics', label: 'Analytics & Audit', icon: AnalyticsIcon, pro: true },  { to: '/organization/settings', label: 'Settings', icon: Settings },
  ],
  user: [
    { to: '/user', label: 'Dashboard', icon: LayoutDashboard, end: true }, { to: '/user/trainings', label: 'My Trainings', icon: BookOpen }, { to: '/user/history', label: 'Training History', icon: History },
    { to: '/user/profile', label: 'Profile', icon: UserCircle }, { to: '/user/notifications', label: 'Notifications', icon: Bell },
  ],
}

export default function AppLayout() {
  const { me, company, db, logout } = useApp()
  const nav2 = useNavigate(), loc = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState<'bell' | 'user' | null>(null)
  const [q, setQ] = useState('')
  if (!me) return null
  const items = nav[me.role], plan = planOf(company)
  const acts = db.activities.filter((a) => me.role === 'admin' || (a.companyId === me.companyId && (!a.userId || a.userId === me.id))).slice(0, 6)
  const search = () => { const base = me.role === 'admin' ? '/admin/trainings' : me.role === 'organization' ? '/organization/trainings' : '/user/trainings'; nav2(`${base}?q=${encodeURIComponent(q)}`) }
  const side = (
    <div className="flex h-full flex-col bg-gradient-to-b from-navy-900 via-navy-800 to-indigo-950 text-slate-300">
      <div className="flex h-16 items-center gap-2 px-4 font-semibold text-white">{company ? <CompanyLogo c={company} className="h-8 w-8 shrink-0 text-sm" /> : <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500"><GraduationCap size={18} /></div>}{(!collapsed || open) && <span className="truncate">{company ? company.name : 'CTMS'}</span>}</div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
        {items.map(({ to, label, icon: I, end, pro }) => (
          <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)} title={tx(label)} className={({ isActive }) => cn('flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-white/10', isActive && 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-md hover:bg-transparent')}>
            <I size={18} className="shrink-0" />{(!collapsed || open) && tx(label)}{(!collapsed || open) && to.endsWith('/subscription') && <span className="ml-auto rounded-full bg-white/15 px-2 text-[10px] font-semibold">{PLANS[plan].name}</span>}{(!collapsed || open) && pro && <span className="ml-auto rounded bg-amber-400/20 px-1.5 text-[10px] font-semibold text-amber-300">PRO</span>}
          </NavLink>
        ))}
      </nav>
      {me.role === 'organization' && plan === 'free' && (!collapsed || open) && <NavLink to="/organization/subscription" onClick={() => setOpen(false)} className="mx-3 mb-3 block rounded-xl bg-gradient-to-br from-blue-500/30 to-indigo-500/30 p-3 text-xs text-white"><div className="font-semibold">✨ {tx('Upgrade to Premium')}</div><div className="mt-1 opacity-80">{tx('Certificates, CSV export, and more users.')}</div></NavLink>}
      <button className="hidden items-center gap-3 border-t border-white/10 px-5 py-3 text-sm hover:text-white lg:flex" onClick={() => setCollapsed(!collapsed)}>{collapsed ? <ChevronRight size={18} /> : <><ChevronLeft size={18} />{tx('Collapse')}</>}</button>
    </div>
  )
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className={cn('hidden shrink-0 transition-all lg:block', collapsed ? 'w-16' : 'w-60')}>{side}</aside>
      {open && <div className="fixed inset-0 z-40 lg:hidden"><div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} /><div className="absolute inset-y-0 left-0 w-64">{side}</div></div>}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="relative z-30 flex h-16 shrink-0 items-center gap-3 border-b bg-white/80 px-4 backdrop-blur">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Menu"><Menu size={20} /></button>
          <div className="relative hidden max-w-sm flex-1 sm:block"><Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()} placeholder={tx('Search trainings… (Enter)')} className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none" /></div>
          <div className="ml-auto flex items-center gap-3">
            <Prefs />{me.role === 'organization' && <Badge tone={plan === 'pro' ? 'orange' : plan === 'premium' ? 'blue' : 'slate'}>{PLANS[plan].name}</Badge>}<Badge tone="orange">{tx('Local Mode')}</Badge>
            <div className="relative"><button className="relative rounded-md p-2 hover:bg-slate-100" onClick={() => setMenu(menu === 'bell' ? null : 'bell')} aria-label="Notifications"><Bell size={18} />{acts.length > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />}</button>
              {menu === 'bell' && <div className="absolute right-0 mt-2 w-80 rounded-xl border bg-white p-3 shadow-lg"><div className="mb-1 text-sm font-semibold">{tx('Notifications')}</div>
                {acts.map((a) => <div key={a.id} className="border-b py-2 text-sm last:border-0">{a.text}<div className="text-xs text-slate-400">{ago(a.at)}</div></div>)}
                {me.role === 'user' && <button className="mt-2 text-xs text-blue-600" onClick={() => { setMenu(null); nav2('/user/notifications') }}>{tx('View all')}</button>}</div>}</div>
            <div className="relative"><button className="flex items-center gap-2 rounded-md p-1 hover:bg-slate-100" onClick={() => setMenu(menu === 'user' ? null : 'user')}>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-900 text-xs font-semibold text-white">{me.name.slice(0, 1)}</div><span className="hidden text-left text-xs leading-tight sm:block"><b className="block text-sm">{me.name}</b><span className="capitalize text-slate-500">{tx(me.role)}</span></span></button>
              {menu === 'user' && <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-white p-1 shadow-lg"><div className="px-3 py-2 text-xs text-slate-500">{me.email}{company && <div className="font-medium text-slate-700">{company.name}</div>}</div>
                <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-slate-100" onClick={() => { setMenu(null); nav2(`/${me.role}/${me.role === 'user' ? 'profile' : 'settings'}`) }}><UserCircle size={16} />{me.role === 'user' ? tx('Profile') : tx('Settings')}</button>
                <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50" onClick={() => { logout(); nav2('/login') }}><LogOut size={16} />{tx('Logout')}</button></div>}</div>
          </div>
        </header>
        <main key={loc.pathname} className="flex-1 overflow-y-auto p-4 md:p-8" onClick={() => menu && setMenu(null)}><Outlet /></main>
      </div>
    </div>
  )
}
