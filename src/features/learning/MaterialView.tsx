import { useState } from 'react'
import { Download, ExternalLink, FileText } from 'lucide-react'
import { Material } from '../../types'
import { isHttp, ytEmbed } from '../../utils'
import { isIdb } from '../../services/files'
import { tx } from '../../utils/i18n'
import { useBlobUrl } from '../../hooks/useBlobUrl'

export default function MaterialView({ m }: { m: Material }) {
  const [checked, setChecked] = useState<number[]>([])
  const { url, meta } = useBlobUrl(m.type === 'checklist' || m.type === 'text' ? '' : m.content)
  if (m.type === 'text') return <p className="whitespace-pre-wrap leading-relaxed text-slate-700">{m.content}</p>
  if (m.type === 'checklist') return <ul className="space-y-2">{m.content.split('\n').filter(Boolean).map((l, i) => <li key={i}><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={checked.includes(i)} onChange={() => setChecked(checked.includes(i) ? checked.filter((x) => x !== i) : [...checked, i])} /><span className={checked.includes(i) ? 'text-slate-400 line-through' : ''}>{l}</span></label></li>)}</ul>
  if (!isIdb(m.content) && !isHttp(m.content)) return <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{tx('This link is not allowed (only http/https).')}</div>
  if (meta === null) return <div className="rounded-xl bg-orange-50 p-4 text-sm text-orange-700">{tx('This file is stored in another browser and cannot be shown here (storage is per browser).')}</div>
  if (m.type === 'image') return url ? <img src={url} referrerPolicy="no-referrer" alt={m.title} className="max-h-[480px] w-full rounded-xl object-contain" /> : null
  if (m.type === 'video') { const e = ytEmbed(m.content); if (e) return <div className="aspect-video overflow-hidden rounded-xl"><iframe src={e} title={m.title} className="h-full w-full" allowFullScreen sandbox="allow-scripts allow-same-origin allow-presentation" referrerPolicy="strict-origin-when-cross-origin" /></div>; return url ? <video src={url} controls className="max-h-[480px] w-full rounded-xl bg-black" /> : null }
  return <a href={url} download={meta?.name} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border p-4 hover:bg-slate-50"><FileText className="text-blue-600" /><span className="flex-1 text-sm font-medium">{meta?.name || m.title}</span>{meta ? <Download size={16} /> : <ExternalLink size={16} />}</a>
}
