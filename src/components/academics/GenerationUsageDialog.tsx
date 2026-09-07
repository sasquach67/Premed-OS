import { useEffect, useState } from 'react'
import { ReceiptText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
type Usage = { id: string; job_id: string | null; request_group_id: string | null; stage: string; provider: string; status: string; input_tokens: number | null; output_tokens: number | null; cached_input_tokens: number | null; estimated_usd: number | null; created_at: string }
export function GenerationUsageDialog() {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<Usage[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (!open) return
    let active = true
    async function read() {
      setRows([]); setError(''); setLoading(true)
      try {
        if (!supabase || !(await supabase.auth.getUser()).data.user) throw new Error('Sign in to see your generation usage.')
        const { data, error } = await supabase.from('study_generation_usage').select('id,job_id,request_group_id,stage,provider,status,input_tokens,output_tokens,cached_input_tokens,estimated_usd,created_at').order('created_at', { ascending: false }).limit(200)
        if (error) throw new Error('Usage history is temporarily unavailable.')
        if (active) setRows((data ?? []) as Usage[])
      } catch (e) { if (active) setError(e instanceof Error ? e.message : 'Usage history is unavailable.') }
      finally { if (active) setLoading(false) }
    }
    void read()
    return () => { active = false }
  }, [open])
  const known = rows.filter(r => r.estimated_usd !== null)
  const estimate = known.reduce((sum, r) => sum + Number(r.estimated_usd), 0)
  const count = (v: number | null) => v === null ? 'Unknown' : Number(v).toLocaleString()
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button variant="outline"><ReceiptText className="size-4" />Generation usage</Button></DialogTrigger>
    <DialogContent className="max-h-[85dvh] max-w-3xl overflow-y-auto">
      <DialogHeader><DialogTitle>Generation usage</DialogTitle><DialogDescription>Your latest 200 tracked generation and review requests. Tracking starts with this update; earlier work, recall checks, embeddings, and transcription are not included.</DialogDescription></DialogHeader>
      {loading ? <p role="status">Loading usage…</p> : error ? <p role="alert">{error}</p> : <>
        <p className="text-sm">{rows.length} requests · {new Set(rows.map(r => r.job_id ?? r.request_group_id ?? r.id)).size} build requests</p>
        {known.length > 0 && <p className="text-sm"><b>${estimate.toFixed(4)}</b> estimated subtotal for {known.length} priced requests.</p>}
        <p className="text-xs leading-5 text-muted-foreground">{rows.length - known.length} requests have unknown cost. Dollar amounts use standard OpenAI Astra rates and the returned cache breakdown, not your invoice or backup allowance. Cheaper Inference and Anthropic costs remain unknown. Missing usage is never counted as free.</p>
        {!rows.length ? <p className="text-sm">No tracked requests yet. Importing a guide makes no AI request.</p> : <div className="max-w-full overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr>{['Build / step', 'Provider / status', 'Input', 'Cached input', 'Output', 'Estimate'].map(t => <th key={t} className="p-2">{t}</th>)}</tr></thead><tbody>{rows.map(r => <tr key={r.id} className="border-t align-top"><td className="p-2">{(r.job_id ?? r.request_group_id ?? r.id).slice(0, 8)} · {r.stage}<br />{new Date(r.created_at).toLocaleString()}</td><td className="p-2">{r.provider}<br />{r.status}</td><td className="p-2">{count(r.input_tokens)}</td><td className="p-2">{count(r.cached_input_tokens)}</td><td className="p-2">{count(r.output_tokens)}</td><td className="p-2">{r.estimated_usd === null ? 'Unknown' : `$${Number(r.estimated_usd).toFixed(4)}`}</td></tr>)}</tbody></table></div>}
      </>}
    </DialogContent>
  </Dialog>
}
