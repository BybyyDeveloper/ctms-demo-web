import { useState } from 'react'
import { Lock } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { tx } from '../../utils/i18n'
import { Button, Card, Field, Input } from '../../components/ui'
import { useUpsell } from '../../components/Upsell'
import { can, planOf } from './plans'
import Certificate from './Certificate'

export default function CertSettings() {
  const { company, update } = useApp(), plan = planOf(company), upsell = useUpsell()
  const [signer, setSigner] = useState(company?.certSigner || ''), [title, setTitle] = useState(company?.certTitle || ''), [ok, setOk] = useState(false), [prev, setPrev] = useState(false)
  if (!company) return null
  const pro = can(plan, 'branding'), cert = can(plan, 'certificate')
  const save = () => { update((d) => { const c = d.companies.find((x) => x.id === company.id)!; c.certSigner = signer.trim().slice(0, 60); c.certTitle = title.trim().slice(0, 60) }); setOk(true); setTimeout(() => setOk(false), 1500) }
  return (<Card className="space-y-3 md:col-span-2"><h3 className="flex items-center gap-2 font-semibold">{tx('Certificate settings')}{!cert && <Lock size={14} className="text-slate-400" />}</h3>
    <div className="grid gap-3 sm:grid-cols-2"><Field label="Signer name"><Input value={signer} maxLength={60} disabled={!pro} onChange={(e) => setSigner(e.target.value)} /></Field><Field label="Signer title"><Input value={title} maxLength={60} disabled={!pro} onChange={(e) => setTitle(e.target.value)} /></Field></div>
    {!pro && <p className="text-xs text-slate-500">{tx('Custom signer and logo on certificates are available on the Pro plan.')}</p>}
    <div className="flex gap-2">{pro && <Button onClick={save}>{ok ? tx('Saved ✓') : tx('Save')}</Button>}
      <Button variant="outline" onClick={() => (cert ? setPrev(true) : upsell('Certificates are available on Premium and Pro plans.'))}>{!cert && <Lock size={13} />}{tx('Preview certificate')}</Button></div>
    {prev && <Certificate onClose={() => setPrev(false)} c={{ name: tx('Sample Participant'), title: 'Workplace Safety Training', org: company.name, logo: pro ? company.logo : undefined, date: new Date().toISOString(), signer: pro ? company.certSigner : undefined, signerTitle: company.certTitle, no: 'CERT-SAMPLE-0001' }} />}</Card>)
}
