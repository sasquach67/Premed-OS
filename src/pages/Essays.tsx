import { useMemo, useState } from 'react'
import {
  Plus, BookOpenText, FileText, Layers, MessagesSquare, ExternalLink, Link2, Tag,
} from 'lucide-react'
import { useStore } from '@/store/store'
import { ROUTE_MAP } from '@/app/routes'
import type { SecondaryEntry } from '@/lib/types'
import { uid } from '@/lib/id'
import { PageHeader } from '@/components/common/PageHeader'
import { Collapsible } from '@/components/common/Collapsible'
import { TrackerTable, type ColumnDef } from '@/components/common/TrackerTable'
import { ResourceGrid } from '@/components/common/ResourceGrid'
import { DocEmbed } from '@/components/common/DocEmbed'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

const PS_CHECKLIST = [
  'Opens with a vivid, specific moment (not a thesis statement)',
  'Answers “why medicine” through experience, not assertion',
  'Shows reflection + growth, not a resume recap',
  'Each paragraph earns its place; no filler',
  'Ends with forward motion (the kind of physician you’ll be)',
  'Read aloud — it sounds like you',
]

const SECONDARY_COLUMNS: ColumnDef[] = [
  { key: 'school', header: 'School', type: 'text', width: '160px' },
  { key: 'prompt', header: 'Prompt', type: 'text' },
  { key: 'wordLimit', header: 'Words', type: 'number', width: '80px', align: 'right' },
  { key: 'status', header: 'Status', type: 'select', width: '130px', options: ['not started', 'drafting', 'submitted'] },
  { key: 'docUrl', header: 'Draft', type: 'link', width: '120px' },
]

export function Essays() {
  const route = ROUTE_MAP.essays
  return (
    <div>
      <PageHeader title={route.label} />
      <Tabs defaultValue="bank">
        <TabsList>
          <TabsTrigger value="bank"><BookOpenText className="size-4" /> Story Bank</TabsTrigger>
          <TabsTrigger value="ps"><FileText className="size-4" /> Personal Statement</TabsTrigger>
          <TabsTrigger value="secondaries"><Layers className="size-4" /> Secondaries</TabsTrigger>
          <TabsTrigger value="interview"><MessagesSquare className="size-4" /> Interview Prep</TabsTrigger>
        </TabsList>

        <TabsContent value="bank"><StoryBank /></TabsContent>
        <TabsContent value="ps"><PersonalStatement /></TabsContent>
        <TabsContent value="secondaries"><Secondaries /></TabsContent>
        <TabsContent value="interview"><InterviewPrep /></TabsContent>
      </Tabs>
    </div>
  )
}

function StoryBank() {
  const stories = useStore((s) => s.stories)
  const patchItem = useStore((s) => s.patchItem)
  const removeItem = useStore((s) => s.removeItem)
  const addItem = useStore((s) => s.addItem)
  const written = stories.filter((s) => s.commentary.trim()).length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground"><b className="text-foreground">{written}</b> of {stories.length} reflections written</p>
        <Button size="sm" variant="outline" onClick={() => addItem('stories', { id: uid(), prompt: 'New reflection', title: '', commentary: '', tags: [], order: 0 })}><Plus className="size-4" /> New story</Button>
      </div>
      {stories.map((st) => (
        <Collapsible
          key={st.id}
          defaultOpen={false}
          title={st.prompt || (st.capturedAt ? `Captured thought · ${new Date(st.capturedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : 'Captured thought')}
          badge={st.origin === 'overview'
            ? <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-secondary-foreground">captured</span>
            : st.commentary.trim() ? <span className="rounded-full bg-[color-mix(in_srgb,var(--success)_16%,transparent)] px-2 py-0.5 text-xs font-bold text-[color-mix(in_srgb,var(--success)_60%,var(--foreground))]">written</span> : <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">empty</span>}
        >
          <div className="space-y-3">
            <Input defaultValue={st.title} placeholder={st.origin === 'overview' ? 'Optional title…' : 'Give this story a title…'} onBlur={(e) => patchItem('stories', st.id, { title: e.target.value, updatedAt: Date.now() })} />
            <Textarea defaultValue={st.commentary} placeholder="Your personal commentary — what happened, why it mattered, what it says about you…" onBlur={(e) => patchItem('stories', st.id, { commentary: e.target.value, updatedAt: Date.now() })} className="min-h-32" />
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-muted-foreground"><Tag className="size-3.5" /></span>
              <Input defaultValue={st.tags.join(', ')} placeholder="tags: leadership, clinical…" onBlur={(e) => patchItem('stories', st.id, { tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean), updatedAt: Date.now() })} className="h-8 max-w-xs" />
              {st.origin === 'overview' && (
                <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Checkbox checked={st.localOnly === true} onCheckedChange={(checked) => patchItem('stories', st.id, { localOnly: Boolean(checked), updatedAt: Date.now() })} />
                  Keep local; never sync
                </label>
              )}
              <div className="ml-auto flex items-center gap-2">
                {st.docUrl
                  ? <Button asChild size="sm" variant="outline"><a href={st.docUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-3.5" /> Open doc</a></Button>
                  : <LinkDoc onSet={(url) => patchItem('stories', st.id, { docUrl: url })} />}
                <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => removeItem('stories', st.id)}>Delete</Button>
              </div>
            </div>
          </div>
        </Collapsible>
      ))}
    </div>
  )
}

function LinkDoc({ onSet }: { onSet: (url: string) => void }) {
  const [url, setUrl] = useState('')
  const [open, setOpen] = useState(false)
  if (!open) return <Button size="sm" variant="outline" onClick={() => setOpen(true)}><Link2 className="size-3.5" /> Write in a doc</Button>
  return (
    <div className="flex gap-1">
      <Input autoFocus value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste Google Doc URL" className="h-8 w-48" />
      <Button size="sm" onClick={() => url.trim() && onSet(url.trim())}>Link</Button>
    </div>
  )
}

function PersonalStatement() {
  const url = useStore((s) => s.notes['ps-doc'] ?? '')
  const setNote = useStore((s) => s.setNote)
  const [checked, setChecked] = useState<boolean[]>(() => PS_CHECKLIST.map(() => false))

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader><CardTitle>Draft workspace</CardTitle></CardHeader>
          <CardContent>
            <DocEmbed title="Personal statement draft" value={url} onChange={(u) => setNote('ps-doc', u)} height={520} />
          </CardContent>
        </Card>
        <ResourceGrid pillar="essays" />
      </div>
      <Card className="h-fit">
        <CardHeader><CardTitle>Analysis checklist</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {PS_CHECKLIST.map((item, i) => (
            <label key={i} className="flex cursor-pointer items-start gap-2.5 text-sm">
              <input type="checkbox" checked={checked[i]} onChange={() => setChecked((c) => c.map((v, j) => j === i ? !v : v))} className="mt-1 accent-[var(--primary)]" />
              <span className={checked[i] ? 'text-muted-foreground line-through' : ''}>{item}</span>
            </label>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function Secondaries() {
  const secondaries = useStore((s) => s.secondaries)
  const addItem = useStore((s) => s.addItem)
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => addItem('secondaries', { id: uid(), school: '', prompt: '', status: 'not started', order: 0 } as SecondaryEntry)}><Plus className="size-4" /> Add prompt</Button>
      </div>
      <TrackerTable
        collection="secondaries"
        listId="essays.secondaries"
        rows={secondaries}
        columns={SECONDARY_COLUMNS}
        empty={<p className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">Pre-write common prompts (diversity, adversity, “why us”) in June — it’s a known timing edge.</p>}
      />
    </div>
  )
}

function InterviewPrep() {
  const interviewQs = useStore((s) => s.interviewQs)
  const patchItem = useStore((s) => s.patchItem)
  const addItem = useStore((s) => s.addItem)

  const groups = useMemo(() => {
    const map = new Map<string, typeof interviewQs>()
    for (const q of interviewQs) { const arr = map.get(q.category) ?? []; arr.push(q); map.set(q.category, arr) }
    return [...map.entries()]
  }, [interviewQs])

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => addItem('interviewQs', { id: uid(), question: 'New question', answer: '', category: 'Behavioral', order: 0 })}><Plus className="size-4" /> Add question</Button>
      </div>
      {groups.map(([cat, qs]) => (
        <Collapsible key={cat} defaultOpen title={cat} badge={<span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-secondary-foreground">{qs.length}</span>}>
          <div className="space-y-3">
            {qs.map((q) => (
              <div key={q.id}>
                <input defaultValue={q.question} onBlur={(e) => patchItem('interviewQs', q.id, { question: e.target.value })} className="w-full bg-transparent text-sm font-semibold outline-none" />
                <Textarea defaultValue={q.answer} placeholder="Your answer / talking points…" onBlur={(e) => patchItem('interviewQs', q.id, { answer: e.target.value })} className="mt-1 min-h-20" />
              </div>
            ))}
          </div>
        </Collapsible>
      ))}
    </div>
  )
}
