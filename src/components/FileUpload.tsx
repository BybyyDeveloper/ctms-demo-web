import { ChangeEvent, useRef, useState } from 'react'
import { FileText, ImageIcon, Trash2, Upload, Video } from 'lucide-react'
import { deleteFile, isIdb, putFile, usedBytes } from '../services/files'
import { useApp } from '../contexts/AppContext'
import { PLANS, planOf } from '../features/billing/plans'
import { useBlobUrl } from '../hooks/useBlobUrl'
import { DOC_EXT, IMG_OK, VID_OK, fmtSize } from '../utils'
import { tx } from '../utils/i18n'
import { Button, Input } from './ui'

const LIM = { image: 10, video: 200, doc: 25 }
const ACC = { image: 'image/*', video: 'video/*', doc: '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt' }
const Ico = { image: ImageIcon, video: Video, doc: FileText }

export default function FileUpload({ kind, value, onChange, placeholder }: { kind: 'image' | 'video' | 'doc'; value: string; onChange: (v: string) => void; placeholder: string }) {
  const { company } = useApp(), [err, setErr] = useState(''), [busy, setBusy] = useState(false), ref = useRef<HTMLInputElement>(null)
  const { url, meta } = useBlobUrl(isIdb(value) ? value : '')
  const I = Ico[kind]
  const pick = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = ''
    if (!f) return
    if (f.size > LIM[kind] * 1048576) return setErr(tx('File too large (max {n} MB)', { n: LIM[kind] }))
    if (!(kind === 'image' ? IMG_OK.includes(f.type) : kind === 'video' ? VID_OK.includes(f.type) : DOC_EXT.test(f.name))) return setErr(tx('File type not allowed'))
    setBusy(true); setErr('')
    if ((await usedBytes()) + f.size > PLANS[planOf(company)].storageMB * 1048576) { setBusy(false); return setErr(tx('Storage limit reached for your plan. Upgrade to get more space.')) }
    try { if (isIdb(value)) await deleteFile(value); onChange(await putFile(f)) } catch { setErr(tx('Upload failed. Browser storage may be full or blocked.')) }
    setBusy(false)
  }
  const remove = async () => { await deleteFile(value); onChange('') }
  return (
    <div className="space-y-1.5">
      {isIdb(value) ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-sm">
          {kind === 'image' && url ? <img src={url} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <I size={20} className="mx-1.5 text-emerald-600" />}
          <div className="min-w-0 flex-1"><div className="truncate font-medium">{meta ? meta.name : meta === null ? tx('File not found in this browser') : '…'}</div>{meta && <div className="text-xs text-slate-500">{fmtSize(meta.size)}</div>}</div>
          <Button type="button" variant="ghost" size="icon" onClick={remove}><Trash2 size={15} className="text-red-600" /></Button>
        </div>
      ) : (
        <div className="flex gap-2"><Input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
          <Button type="button" variant="outline" disabled={busy} onClick={() => ref.current?.click()}><Upload size={14} />{busy ? tx('Uploading…') : tx('Upload')}</Button></div>
      )}
      <input ref={ref} type="file" accept={ACC[kind]} className="hidden" onChange={pick} />
      {err && <div className="text-xs text-red-600">{err}</div>}
    </div>
  )
}
