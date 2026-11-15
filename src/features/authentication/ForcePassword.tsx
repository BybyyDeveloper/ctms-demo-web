import { FormEvent, useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import { pwIssue } from '../../services/security'
import { tx } from '../../utils/i18n'
import { Button, Card, Field, Input } from '../../components/ui'

export default function ForcePassword() {
  const { me, setPassword, logout } = useApp(), [a, setA] = useState(''), [b, setB] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const x = pwIssue(a) || (a !== b ? 'Passwords do not match' : '')
    if (x) return setErr(x)
    setBusy(true); await setPassword(me!.id, a, false); setBusy(false)
  }
  return (
    <div className="flex min-h-screen items-center justify-center p-4"><Card className="w-full max-w-md space-y-4 p-7 shadow-xl">
      <h1 className="text-xl font-semibold text-navy-900">{tx('Set a new password')}</h1><p className="text-sm text-slate-500">{tx('Your account was created with a temporary password. Please choose your own password to continue.')}</p>
      <form onSubmit={submit} className="space-y-3" noValidate>
        <Field label="New password"><Input type="password" autoComplete="new-password" value={a} onChange={(e) => setA(e.target.value)} /></Field>
        <Field label="Confirm password" error={err}><Input type="password" autoComplete="new-password" value={b} onChange={(e) => setB(e.target.value)} /></Field>
        <div className="flex gap-2"><Button type="submit" disabled={busy}>{tx('Save')}</Button><Button type="button" variant="ghost" onClick={() => logout()}>{tx('Logout')}</Button></div>
      </form></Card></div>
  )
}
