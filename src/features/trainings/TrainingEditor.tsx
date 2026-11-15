import { ChangeEvent, FormEvent, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Trash2, Upload } from 'lucide-react'
import { log, useApp } from '../../contexts/AppContext'
import { Level, MatType, Training } from '../../types'
import { IMG_OK, isImgSrc, resizeImage, uid } from '../../utils'
import { tx } from '../../utils/i18n'
import FileUpload from '../../components/FileUpload'
import { LimitCard } from '../../components/Upsell'
import { PLANS, planOf } from '../billing/plans'
import { Button, Card, Field, Input, PageHeader, Select, Textarea } from '../../components/ui'

const types: MatType[] = ['text', 'image', 'video', 'doc', 'checklist']
const hint: Record<MatType, string> = { text: 'Material text', image: 'Image URL (https://…)', video: 'YouTube link or video URL', doc: 'Document link (https://…)', checklist: 'One item per line' }
const colors = ['blue', 'orange', 'indigo', 'slate', 'emerald', 'rose']
function ThumbUpload({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [err, setErr] = useState(''), ref = useRef<HTMLInputElement>(null)
  const pick = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = ''
    if (!f) return
    if (!IMG_OK.includes(f.type)) return setErr('File type not allowed')
    try { onChange(await resizeImage(f, 640)); setErr('') } catch { setErr('Upload failed. Browser storage may be full or blocked.') }
  }
  return <div className="space-y-1"><div className="flex gap-2"><Input value={value.startsWith('data:') ? '✓ uploaded' : value} readOnly={value.startsWith('data:')} onChange={(e) => onChange(e.target.value)} /><Button type="button" variant="outline" onClick={() => ref.current?.click()}><Upload size={14} />{tx('Upload')}</Button></div><input ref={ref} type="file" accept="image/*" className="hidden" onChange={pick} />{err && <div className="text-xs text-red-600">{tx(err)}</div>}</div>
}

export default function TrainingEditor() {
  const { id } = useParams(), nav = useNavigate(), { db, me, update, company } = useApp()
  const cid = me!.companyId!, existing = db.trainings.find((t) => t.id === id && t.companyId === cid)
  const [t, setT] = useState<Training>(() => existing ? structuredClone(existing) : {
    id: uid(), companyId: cid, title: '', description: '', categoryId: '', thumbnail: 'blue', level: 'Beginner', duration: 30, createdAt: new Date().toISOString().slice(0, 10),
    deadline: new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10), status: 'draft', modules: [{ id: uid(), title: 'Module 1', materials: [] }], quiz: [],
  })
  const [errs, setErrs] = useState<string[]>([])
  if (id && !existing) return <Card>Training not found.</Card>
  if (!existing && db.trainings.filter((t) => t.companyId === cid).length >= PLANS[planOf(company)].trainings) return <LimitCard msg="You have reached the training limit of your plan ({n}). Upgrade to create more trainings." vars={{ n: PLANS[planOf(company)].trainings }} />
  const cats = db.categories.filter((c) => c.companyId === cid)
  const set = (p: Partial<Training>) => setT({ ...t, ...p })
  const setMod = (mi: number, fn: (m: Training['modules'][0]) => void) => { const n = structuredClone(t); fn(n.modules[mi]); setT(n) }
  const save = (e: FormEvent, status?: 'draft' | 'published') => {
    e.preventDefault()
    const x: string[] = []
    if (t.title.trim().length < 3) x.push('Title must be at least 3 characters')
    if (!t.deadline) x.push('Deadline is required')
    if (t.duration < 1) x.push('Duration must be at least 1 minute')
    if (t.modules.length === 0) x.push('Add at least one module')
    t.modules.forEach((m, i) => { if (!m.title.trim()) x.push(tx('Module {n} needs a title', { n: i + 1 })); m.materials.forEach((mt) => { if (!mt.title.trim() || !mt.content.trim()) x.push(tx('A material in "{m}" needs a title and content', { m: m.title || 'Module ' + (i + 1) })); if (['image', 'video', 'doc'].includes(mt.type) && mt.content.trim() && !/^https?:\/\//i.test(mt.content.trim()) && !mt.content.startsWith('idb:')) x.push(tx('"{m}" needs a valid URL (https://…) or an uploaded file', { m: mt.title })) }) })
    t.quiz.forEach((q, i) => { if (!q.q.trim() || q.options.filter((o) => o.trim()).length < 2) x.push(tx('Quiz question {n} needs text and at least 2 options', { n: i + 1 })); else if (q.answer >= q.options.filter((o) => o.trim()).length) x.push(tx('Quiz question {n}: correct answer is out of range', { n: i + 1 })) })
    setErrs([...new Set(x)]); if (x.length) return
    const final: Training = { ...t, title: t.title.trim(), status: status || t.status, quiz: t.quiz.map((q) => ({ ...q, options: q.options.filter((o) => o.trim()) })) }
    update((d) => { const i = d.trainings.findIndex((y) => y.id === final.id); if (i >= 0) d.trainings[i] = final; else { d.trainings.unshift(final); log(d, `New training "${final.title}" created`, cid) } })
    nav('/organization/trainings')
  }
  return (
    <form onSubmit={(e) => save(e)} noValidate>
      <PageHeader title={existing ? tx('Edit Training') : tx('Create Training')} desc="Atur info, modul, materi, dan kuis." action={<div className="flex gap-2"><Button type="submit" variant="outline">{tx('Save')} {tx(t.status)}</Button><Button type="button" onClick={(e) => save(e, 'published')}>{tx('Save & publish')}</Button></div>} />
      {errs.length > 0 && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"><ul className="list-disc pl-4">{errs.map((e) => <li key={e}>{tx(e)}</li>)}</ul></div>}
      <Card className="mb-4 grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2"><Field label="Title"><Input value={t.title} onChange={(e) => set({ title: e.target.value })} /></Field></div>
        <div className="md:col-span-2"><Field label="Description"><Textarea value={t.description} onChange={(e) => set({ description: e.target.value })} /></Field></div>
        <Field label="Category"><Select value={t.categoryId} onChange={(e) => set({ categoryId: e.target.value })}><option value="">{tx('Uncategorized')}</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
        <Field label="Level"><Select value={t.level} onChange={(e) => set({ level: e.target.value as Level })}><option value="Beginner">{tx('Beginner')}</option><option value="Intermediate">{tx('Intermediate')}</option><option value="Advanced">{tx('Advanced')}</option></Select></Field>
        <Field label="Duration (minutes)"><Input type="number" min={1} value={t.duration} onChange={(e) => set({ duration: Number(e.target.value) })} /></Field>
        <Field label="Deadline"><Input type="date" value={t.deadline} onChange={(e) => set({ deadline: e.target.value })} /></Field>
        <Field label="Thumbnail"><Select value={isImgSrc(t.thumbnail) ? 'custom' : t.thumbnail} onChange={(e) => set({ thumbnail: e.target.value === 'custom' ? 'https://picsum.photos/seed/ctms/600/300' : e.target.value })}>{colors.map((c) => <option key={c} value={c}>{tx(c)}</option>)}<option value="custom">{tx('Custom image…')}</option></Select></Field>
        {isImgSrc(t.thumbnail) && <Field label="Thumbnail image"><ThumbUpload value={t.thumbnail} onChange={(v) => set({ thumbnail: v })} /></Field>}
      </Card>
      <div className="mb-2 flex items-center justify-between"><h3 className="font-semibold">{tx('Modules')}</h3><Button type="button" variant="outline" size="sm" onClick={() => set({ modules: [...t.modules, { id: uid(), title: `Module ${t.modules.length + 1}`, materials: [] }] })}><Plus size={14} />{tx('Add module')}</Button></div>
      <div className="space-y-4">{t.modules.map((m, mi) => (
        <Card key={m.id} className="space-y-3"><div className="flex gap-2"><Input value={m.title} onChange={(e) => setMod(mi, (x) => { x.title = e.target.value })} placeholder="Module title" /><Button type="button" variant="ghost" size="icon" onClick={() => set({ modules: t.modules.filter((_, i) => i !== mi) })}><Trash2 size={15} className="text-red-600" /></Button></div>
          {m.materials.map((mt, i) => (<div key={mt.id} className="space-y-2 rounded-lg bg-slate-50 p-3"><div className="flex gap-2"><Input value={mt.title} placeholder="Material title" onChange={(e) => setMod(mi, (x) => { x.materials[i].title = e.target.value })} />
            <Select className="w-32" value={mt.type} onChange={(e) => setMod(mi, (x) => { x.materials[i].type = e.target.value as MatType })}>{types.map((y) => <option key={y} value={y}>{tx(y)}</option>)}</Select>
            <Button type="button" variant="ghost" size="icon" onClick={() => setMod(mi, (x) => { x.materials.splice(i, 1) })}><Trash2 size={15} /></Button></div>
            {mt.type === 'text' || mt.type === 'checklist' ? <Textarea value={mt.content} placeholder={hint[mt.type]} onChange={(e) => setMod(mi, (x) => { x.materials[i].content = e.target.value })} /> : <FileUpload kind={mt.type as 'image' | 'video' | 'doc'} value={mt.content} placeholder={hint[mt.type]} onChange={(v) => setMod(mi, (x) => { x.materials[i].content = v })} />}</div>))}
          <Button type="button" variant="outline" size="sm" onClick={() => setMod(mi, (x) => { x.materials.push({ id: uid(), title: '', type: 'text', content: '' }) })}><Plus size={14} />{tx('Add material')}</Button></Card>))}</div>
      <div className="mb-2 mt-6 flex items-center justify-between"><h3 className="font-semibold">{tx('Quiz')}</h3><Button type="button" variant="outline" size="sm" onClick={() => set({ quiz: [...t.quiz, { q: '', options: ['', '', ''], answer: 0 }] })}><Plus size={14} />{tx('Add question')}</Button></div>
      <div className="space-y-3">{t.quiz.map((q, i) => (<Card key={i} className="space-y-2"><div className="flex gap-2"><Input placeholder={tx('Question {n}', { n: i + 1 })} value={q.q} onChange={(e) => { const n = structuredClone(t); n.quiz[i].q = e.target.value; setT(n) }} /><Button type="button" variant="ghost" size="icon" onClick={() => set({ quiz: t.quiz.filter((_, j) => j !== i) })}><Trash2 size={15} className="text-red-600" /></Button></div>
        <div className="grid gap-2 sm:grid-cols-3">{q.options.map((o, oi) => <Input key={oi} placeholder={tx('Option {n}', { n: oi + 1 })} value={o} onChange={(e) => { const n = structuredClone(t); n.quiz[i].options[oi] = e.target.value; setT(n) }} />)}</div>
        <Field label="Correct option"><Select value={q.answer} onChange={(e) => { const n = structuredClone(t); n.quiz[i].answer = Number(e.target.value); setT(n) }}>{q.options.map((_, oi) => <option key={oi} value={oi}>{tx('Option {n}', { n: oi + 1 })}</option>)}</Select></Field></Card>))}</div>
    </form>
  )
}
