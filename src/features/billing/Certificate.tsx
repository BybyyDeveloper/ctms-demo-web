import { Printer } from 'lucide-react'
import { fmt } from '../../utils'
import { tx } from '../../utils/i18n'
import { Button, Modal } from '../../components/ui'

export interface CertData { name: string; title: string; org: string; logo?: string; date: string; signer?: string; signerTitle?: string; no: string }
export default function Certificate({ c, onClose }: { c: CertData; onClose: () => void }) {
  return (
    <Modal title="Certificate" onClose={onClose} wide>
      <div className="print-area"><div style={{ background: '#fff', color: '#0f172a', border: '10px double #1e3a8a', padding: '36px 28px', textAlign: 'center', fontFamily: 'Georgia, serif' }}>
        {c.logo && <img src={c.logo} alt="" style={{ height: 56, margin: '0 auto 8px', objectFit: 'contain' }} />}
        <div style={{ letterSpacing: 4, fontSize: 12, color: '#1e3a8a', textTransform: 'uppercase' }}>{c.org}</div>
        <h2 style={{ fontSize: 30, margin: '10px 0 18px', color: '#1e3a8a' }}>{tx('Certificate of Completion')}</h2>
        <p style={{ fontSize: 13, color: '#475569' }}>{tx('This certifies that')}</p>
        <div style={{ fontSize: 28, fontStyle: 'italic', margin: '8px 0', borderBottom: '1px solid #94a3b8', display: 'inline-block', padding: '0 24px' }}>{c.name}</div>
        <p style={{ fontSize: 13, color: '#475569', marginTop: 10 }}>{tx('has successfully completed the training')}</p>
        <div style={{ fontSize: 20, fontWeight: 700, margin: '6px 0 22px' }}>{c.title}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 12, color: '#475569', textAlign: 'left' }}>
          <div><div>{tx('Issued on')} {fmt(c.date)}</div><div>{tx('Certificate no.')} {c.no}</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontFamily: 'cursive', fontSize: 20, color: '#0f172a' }}>{c.signer || ''}</div><div style={{ borderTop: '1px solid #475569', paddingTop: 2, minWidth: 180 }}>{c.signer ? c.signerTitle || '' : tx('Authorized signatory')}</div></div>
        </div></div></div>
      <div className="mt-4 flex justify-end"><Button onClick={() => window.print()}><Printer size={15} />{tx('Print / Save as PDF')}</Button></div>
    </Modal>
  )
}
