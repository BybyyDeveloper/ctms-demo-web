import { useEffect, useState } from 'react'
import { Check, Crown, Landmark, Loader2, Printer, QrCode, Wallet, X } from 'lucide-react'
import { audit, log, useApp } from '../../contexts/AppContext'
import { Payment } from '../../types'
import { usedBytes } from '../../services/files'
import { fmt, fmtSize, uid } from '../../utils'
import { tx } from '../../utils/i18n'
import { Badge, Button, Card, Empty, Modal, PageHeader, Progress, Table, cn } from '../../components/ui'
import { useToast } from '../../components/Toast'
import { PLANS, Plan, RANK, TAX, idr, planOf } from './plans'

const FEATS: Record<Plan, [boolean, string][]> = {
  free: [[true, 'Up to 25 users'], [true, '3 active trainings'], [true, '100 MB storage'], [true, 'Basic progress reports'], [true, 'Quizzes (multiple choice)'], [false, 'Completion certificates'], [false, 'CSV export'], [false, 'Analytics & audit log']],
  premium: [[true, 'Up to 250 users'], [true, '25 active trainings'], [true, '5 GB storage'], [true, 'Everything in Free'], [true, 'Completion certificates'], [true, 'CSV export of reports'], [false, 'Analytics & audit log'], [false, 'Custom certificate signer']],
  pro: [[true, 'Unlimited users and trainings'], [true, '50 GB storage'], [true, 'Everything in Premium'], [true, 'Analytics dashboard'], [true, 'Audit log'], [true, 'Custom certificate signer'], [true, 'Priority support (demo)']],
}
type Method = 'va_bca' | 'va_mandiri' | 'qris' | 'ewallet'
const METHODS: [Method, string, typeof Landmark][] = [['va_bca', 'Virtual Account BCA', Landmark], ['va_mandiri', 'Virtual Account Mandiri', Landmark], ['qris', 'QRIS', QrCode], ['ewallet', 'E-Wallet', Wallet]]
const mlabel = (m: string) => METHODS.find((x) => x[0] === m)?.[1] || m
const Meter = ({ label, value, max, text }: { label: string; value: number; max: number; text: string }) => (
  <div><div className="mb-1 flex justify-between text-xs text-slate-500"><span>{tx(label)}</span><span>{text}</span></div><Progress value={max === Infinity ? Math.min(value, 5) : Math.min(100, Math.round((value / max) * 100))} /></div>
)

function Qr({ seed }: { seed: string }) {
  const n = 25; let h = 7; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const inF = (x: number, y: number) => (x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8)
  const cells: JSX.Element[] = []
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { h = (h * 1664525 + 1013904223) >>> 0; if (!inF(x, y) && h >> 28 > 7) cells.push(<rect key={x + '-' + y} x={x} y={y} width="1" height="1" />) }
  const F = ({ x, y }: { x: number; y: number }) => <g transform={`translate(${x} ${y})`}><rect width="7" height="7" /><rect x="1" y="1" width="5" height="5" fill="#fff" /><rect x="2" y="2" width="3" height="3" /></g>
  return <svg viewBox={`-1 -1 ${n + 2} ${n + 2}`} className="h-44 w-44 rounded-xl"><rect x="-1" y="-1" width={n + 2} height={n + 2} fill="#fff" /><g fill="#0f172a">{cells}<F x={0} y={0} /><F x={n - 7} y={0} /><F x={0} y={n - 7} /></g></svg>
}

function Invoice({ p, org, plan }: { p: Payment; org: string; plan: string }) {
  const sub = PLANS[p.plan][p.cycle], tax = p.amount - sub
  const row = (a: string, b: string, bold?: boolean) => <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontWeight: bold ? 700 : 400 }}><span>{a}</span><span>{b}</span></div>
  return <div className="print-area"><div style={{ background: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: 12, padding: 24, fontSize: 13 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}><div><b style={{ fontSize: 18 }}>CTMS</b><div style={{ color: '#64748b' }}>{tx('Demo invoice — no real payment was made.')}</div></div><div style={{ textAlign: 'right' }}><b>{p.invoice}</b><div style={{ color: '#64748b' }}>{fmt(p.at)}</div><div style={{ color: '#059669', fontWeight: 700 }}>{tx('PAID')}</div></div></div>
    <div style={{ margin: '16px 0', color: '#475569' }}>{tx('Billed to')}: <b style={{ color: '#0f172a' }}>{org}</b><br />{tx('Payment method')}: {mlabel(p.method)} · {tx('Reference')}: {p.ref}</div>
    {row(tx('Plan {plan} ({cycle})', { plan, cycle: tx(p.cycle === 'yearly' ? 'Yearly' : 'Monthly') }), idr(sub))}{row(tx('VAT 11%'), idr(tax))}<div style={{ borderTop: '1px solid #cbd5e1', marginTop: 6 }} />{row(tx('Total'), idr(p.amount), true)}</div></div>
}

function Checkout({ plan, cycle, companyId, onClose, onPaid, orgName }: { plan: 'premium' | 'pro'; cycle: 'monthly' | 'yearly'; companyId: string; onClose: () => void; onPaid: (p: Payment) => void; orgName: string }) {
  const [step, setStep] = useState<'review' | 'pay' | 'verify' | 'done'>('review'), [method, setMethod] = useState<Method>('va_bca'), [pay, setPay] = useState<Payment | null>(null), toast = useToast()
  const [ref] = useState(() => '8077' + Array.from(crypto.getRandomValues(new Uint8Array(12)), (x) => x % 10).join(''))
  const sub = PLANS[plan][cycle], tax = Math.round(sub * TAX), total = sub + tax
  const confirmPay = () => {
    setStep('verify')
    setTimeout(() => {
      const d = new Date(), p: Payment = { id: uid(), companyId, plan, cycle, amount: total, method, ref, invoice: `INV-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}-${String(crypto.getRandomValues(new Uint16Array(1))[0] % 10000).padStart(4, '0')}`, status: 'paid', at: d.toISOString() }
      onPaid(p); setPay(p); setStep('done')
    }, 2500)
  }
  const until = new Date(Date.now() + (cycle === 'yearly' ? 365 : 30) * 864e5).toISOString()
  return (
    <Modal title="Checkout" onClose={step === 'verify' ? () => undefined : onClose} wide>
      <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-800 dark:text-amber-300">{tx('Simulation only: no real payment is made. Never enter real card or bank details.')}</div>
      {step === 'review' && <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2"><h4 className="text-sm font-semibold">{tx('Order summary')}</h4><Card className="space-y-1 text-sm"><div className="flex items-center justify-between"><b>{PLANS[plan].name}</b><Badge tone="blue">{tx(cycle === 'yearly' ? 'Yearly' : 'Monthly')}</Badge></div>
          <div className="flex justify-between"><span>{tx('Subtotal')}</span><span>{idr(sub)}</span></div><div className="flex justify-between"><span>{tx('VAT 11%')}</span><span>{idr(tax)}</span></div><div className="flex justify-between border-t pt-1 font-semibold"><span>{tx('Total')}</span><span>{idr(total)}</span></div></Card></div>
        <div className="space-y-2"><h4 className="text-sm font-semibold">{tx('Payment method')}</h4>{METHODS.map(([k, l, I]) => <button key={k} onClick={() => setMethod(k)} className={cn('flex w-full items-center gap-2 rounded-xl border p-2.5 text-left text-sm', method === k ? 'border-blue-500 bg-blue-50 text-blue-700' : 'hover:bg-slate-50')}><I size={16} />{l}{method === k && <Check size={15} className="ml-auto" />}</button>)}</div>
        <div className="flex justify-end gap-2 md:col-span-2"><Button variant="ghost" onClick={onClose}>{tx('Close')}</Button><Button onClick={() => setStep('pay')}>{tx('Continue to payment')}</Button></div></div>}
      {step === 'pay' && <div className="space-y-4"><div className="grid items-center gap-4 sm:grid-cols-2">
        <div className="space-y-2 text-sm"><div className="text-slate-500">{mlabel(method)}</div>
          {method.startsWith('va') && <><div className="text-xs text-slate-500">{tx('Virtual account number')}</div><div className="flex items-center gap-2"><span className="font-mono text-xl font-semibold tracking-wider">{ref}</span><Button size="sm" variant="outline" onClick={() => { navigator.clipboard?.writeText(ref); toast('Copied', 'success') }}>{tx('Copy')}</Button></div></>}
          {method === 'ewallet' && <p>{tx('A payment request was sent to your e-wallet app (simulated).')}</p>}
          <div className="text-2xl font-semibold">{idr(total)}</div><div className="text-xs text-slate-500">{tx('Pay within 24 hours (simulated).')}</div></div>
        {method === 'qris' && <div className="flex flex-col items-center gap-2"><Qr seed={ref} /><span className="text-xs text-slate-500">{tx('Scan this QR code with any QRIS app (simulated).')}</span></div>}</div>
        <div className="flex justify-between gap-2"><Button variant="ghost" onClick={() => setStep('review')}>{tx('Back')}</Button><Button variant="success" onClick={confirmPay}><Check size={15} />{tx('I have paid — confirm payment')}</Button></div></div>}
      {step === 'verify' && <div className="flex flex-col items-center gap-3 py-10"><Loader2 className="animate-spin text-blue-600" size={36} /><div className="font-medium">{tx('Verifying your payment…')}</div><div className="text-sm text-slate-500">{tx('Please wait, this takes a few seconds.')}</div></div>}
      {step === 'done' && pay && <div className="space-y-4"><div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-3 text-emerald-700"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white"><Check /></div><div><div className="font-semibold">{tx('Payment confirmed!')}</div><div className="text-sm">{tx('Your {plan} plan is now active until {date}.', { plan: PLANS[plan].name, date: fmt(until) })}</div></div></div>
        <Invoice p={pay} org={orgName} plan={PLANS[plan].name} /><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => window.print()}><Printer size={15} />{tx('Print invoice')}</Button><Button onClick={onClose}>{tx('Close')}</Button></div></div>}
    </Modal>
  )
}

export default function Billing() {
  const { db, update, company } = useApp(), toast = useToast(), cid = company!.id, plan = planOf(company)
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly'), [target, setTarget] = useState<'premium' | 'pro' | null>(null), [inv, setInv] = useState<Payment | null>(null), [used, setUsed] = useState(0)
  useEffect(() => { usedBytes().then(setUsed) }, [])
  const users = db.users.filter((u) => u.role === 'user' && u.companyId === cid).length, trainings = db.trainings.filter((t) => t.companyId === cid).length
  const pays = db.payments.filter((p) => p.companyId === cid), L = PLANS[plan]
  const lim = (n: number) => (n === Infinity ? '∞' : String(n))
  const onPaid = (p: Payment) => update((d) => {
    const c = d.companies.find((x) => x.id === cid)!
    c.plan = p.plan; c.cycle = p.cycle; c.planUntil = new Date(Date.now() + (p.cycle === 'yearly' ? 365 : 30) * 864e5).toISOString()
    d.payments.unshift(p); log(d, `Plan upgraded to ${PLANS[p.plan].name}`, cid); audit(d, `Plan set to ${PLANS[p.plan].name} (${p.invoice})`, cid)
  })
  const toFree = () => {
    if (!confirm(tx('Switch to Free? Premium/Pro features will be locked immediately. Your data is kept.'))) return
    update((d) => { const c = d.companies.find((x) => x.id === cid)!; c.plan = 'free'; c.planUntil = undefined; audit(d, 'Plan set to Free', cid) }); toast('Plan changed to Free.', 'info')
  }
  return (<><PageHeader title="Subscription" desc="Manage your plan, usage, and payments." action={<div className="flex rounded-full border p-0.5 text-sm">{(['monthly', 'yearly'] as const).map((c) => <button key={c} onClick={() => setCycle(c)} className={cn('rounded-full px-3 py-1', cycle === c && 'bg-blue-600 text-white')}>{tx(c === 'monthly' ? 'Monthly' : 'Yearly (2 months free)')}</button>)}</div>} />
    <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:text-amber-300">{tx('Simulation only: no real payment is made. Never enter real card or bank details.')}</div>
    <Card className="mb-6"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><Crown className="text-amber-500" /><div><div className="text-xs text-slate-500">{tx('Current plan')}</div><div className="text-lg font-semibold">{L.name}</div></div></div>
      <div className="text-sm text-slate-500">{plan === 'free' ? tx('No expiry') : tx('Valid until {date}', { date: fmt(company!.planUntil || '') })}</div></div>
      <div className="grid gap-4 md:grid-cols-3"><Meter label="Users" value={users} max={L.users} text={`${users} / ${lim(L.users)}`} /><Meter label="Trainings" value={trainings} max={L.trainings} text={`${trainings} / ${lim(L.trainings)}`} /><Meter label="Storage" value={used} max={L.storageMB * 1048576} text={`${fmtSize(used)} / ${L.storageMB >= 1024 ? L.storageMB / 1024 + ' GB' : L.storageMB + ' MB'}`} /></div></Card>
    <div className="mb-8 grid gap-4 lg:grid-cols-3">{(['free', 'premium', 'pro'] as Plan[]).map((p) => {
      const cur = p === plan, price = PLANS[p][cycle]
      return <Card key={p} className={cn('flex flex-col gap-3', p === 'premium' && 'ring-2 ring-blue-500', cur && 'bg-blue-50/40')}>
        <div className="flex items-center justify-between"><h3 className="text-lg font-semibold">{PLANS[p].name}</h3>{p === 'premium' && <Badge tone="blue">{tx('Most popular')}</Badge>}{cur && <Badge tone="green">{tx('Current plan')}</Badge>}</div>
        <div><span className="text-3xl font-semibold">{p === 'free' ? 'Rp0' : idr(price)}</span>{p !== 'free' && <span className="text-sm text-slate-500"> {tx(cycle === 'monthly' ? '/ month' : '/ year')}</span>}</div>
        <ul className="flex-1 space-y-1.5 text-sm">{FEATS[p].map(([ok, f]) => <li key={f} className={cn('flex items-start gap-2', !ok && 'text-slate-400')}>{ok ? <Check size={15} className="mt-0.5 shrink-0 text-emerald-500" /> : <X size={15} className="mt-0.5 shrink-0" />}{tx(f)}</li>)}</ul>
        {p === 'free' ? <Button variant="outline" disabled={plan === 'free'} onClick={toFree}>{plan === 'free' ? tx('Current plan') : tx('Switch to Free')}</Button>
          : <Button variant={cur ? 'outline' : 'primary'} onClick={() => setTarget(p)}>{cur ? tx('Renew plan') : RANK[p] > RANK[plan] ? tx('Upgrade to {plan}', { plan: PLANS[p].name }) : tx('Switch to {plan}', { plan: PLANS[p].name })}</Button>}</Card>
    })}</div>
    <h3 className="mb-2 font-semibold">{tx('Payment history')}</h3>
    {pays.length === 0 ? <Empty text="No payments yet." /> : <Table head={['Invoice', 'Date', 'Plan', 'Cycle', 'Method', 'Amount', 'Status', '']}>{pays.map((p) => <tr key={p.id}><td className="font-mono text-xs">{p.invoice}</td><td>{fmt(p.at)}</td><td>{PLANS[p.plan].name}</td><td>{tx(p.cycle === 'yearly' ? 'Yearly' : 'Monthly')}</td><td>{mlabel(p.method)}</td><td>{idr(p.amount)}</td><td><Badge tone="green">{tx('Paid')}</Badge></td><td className="text-right"><Button size="sm" variant="outline" onClick={() => setInv(p)}>{tx('View')}</Button></td></tr>)}</Table>}
    {target && <Checkout plan={target} cycle={cycle} companyId={cid} orgName={company!.name} onClose={() => setTarget(null)} onPaid={onPaid} />}
    {inv && <Modal title="Invoice" onClose={() => setInv(null)} wide><Invoice p={inv} org={company!.name} plan={PLANS[inv.plan].name} /><div className="mt-4 flex justify-end"><Button variant="outline" onClick={() => window.print()}><Printer size={15} />{tx('Print invoice')}</Button></div></Modal>}</>)
}
