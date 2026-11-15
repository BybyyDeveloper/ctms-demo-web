import { createContext, ReactNode, useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { tx } from '../utils/i18n'
import { Button, Card, Modal } from './ui'
type Vars = Record<string, string | number>
const U = createContext<(msg: string, vars?: Vars) => void>(() => undefined)
export const useUpsell = () => useContext(U)
export function UpsellProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null), nav = useNavigate()
  return <U.Provider value={(m, v) => setMsg(tx(m, v))}>{children}
    {msg && <Modal title="Upgrade required" onClose={() => setMsg(null)}><div className="space-y-4 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white"><Sparkles /></div>
      <p className="text-sm text-slate-600">{msg}</p><div className="flex justify-center gap-2"><Button onClick={() => { setMsg(null); nav('/organization/subscription') }}>{tx('See plans')}</Button><Button variant="ghost" onClick={() => setMsg(null)}>{tx('Not now')}</Button></div></div></Modal>}</U.Provider>
}
export const LimitCard = ({ msg, vars }: { msg: string; vars?: Vars }) => (
  <Card className="mx-auto max-w-lg space-y-3 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white"><Sparkles /></div><p className="text-sm text-slate-600">{tx(msg, vars)}</p><Link to="/organization/subscription"><Button>{tx('See plans')}</Button></Link></Card>
)
