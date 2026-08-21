import { useMemo, useState } from 'react'
import { GitBranchPlus, Plus, Undo2 } from 'lucide-react'
import type { ClassCenterData, Topic, TopicLinkRelation } from '@/lib/types'
import { uid } from '@/lib/id'
import { linkTopics, RELATION_LABEL, TOPIC_LINK_RELATIONS } from '@/lib/academics/topicGraph'
import { useStore } from '@/store/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function ConceptCanvas({ courseId, topic, data }: { courseId: string; topic: Topic; data: ClassCenterData }) {
  const update = useStore((state) => state.update)
  const existing = data.conceptCanvases.find((canvas) => canvas.courseId === courseId && canvas.topicId === topic.id)
  const [nodeLabel, setNodeLabel] = useState('')
  const [fromNodeId, setFromNodeId] = useState('')
  const [toNodeId, setToNodeId] = useState('')
  const [edgeLabel, setEdgeLabel] = useState('')
  const [proposalTopicId, setProposalTopicId] = useState('')
  const [proposalRelation, setProposalRelation] = useState<TopicLinkRelation>('builds-on')
  const nodes = existing?.nodes ?? []
  const edges = existing?.edges ?? []
  const mapFiles = useMemo(() => data.files.filter((file) => file.courseId === courseId), [courseId, data.files])
  const otherTopics = useMemo(() => data.topics.filter((item) => item.courseId === courseId && item.id !== topic.id), [courseId, data.topics, topic.id])

  function ensureCanvas() {
    const found = useStore.getState().academics.classCenter.conceptCanvases.find((canvas) => canvas.courseId === courseId && canvas.topicId === topic.id)
    if (found) return found.id
    const id = uid(); const now = Date.now()
    update((draft) => draft.academics.classCenter.conceptCanvases.push({ id, courseId, topicId: topic.id, nodes: [], edges: [], createdAt: now, updatedAt: now, order: draft.academics.classCenter.conceptCanvases.filter((canvas) => canvas.courseId === courseId).length }))
    return id
  }
  function addNode() {
    const label = nodeLabel.trim(); if (!label) return
    const canvasId = ensureCanvas(); const now = Date.now()
    update((draft) => { const canvas = draft.academics.classCenter.conceptCanvases.find((item) => item.id === canvasId); if (canvas) { canvas.nodes.push({ id: uid(), label }); canvas.updatedAt = now } })
    setNodeLabel('')
  }
  function addEdge() {
    if (!fromNodeId || !toNodeId || !edgeLabel.trim() || fromNodeId === toNodeId) return
    const canvasId = ensureCanvas(); const now = Date.now()
    update((draft) => { const canvas = draft.academics.classCenter.conceptCanvases.find((item) => item.id === canvasId); if (canvas) { canvas.edges.push({ id: uid(), fromNodeId, toNodeId, label: edgeLabel.trim() }); canvas.updatedAt = now } })
    setEdgeLabel('')
  }
  function removeLastEdge() {
    if (!existing?.edges.length) return
    update((draft) => { const canvas = draft.academics.classCenter.conceptCanvases.find((item) => item.id === existing.id); if (canvas) { canvas.edges.pop(); canvas.updatedAt = Date.now() } })
  }
  function attachSavedFile(fileId: string) {
    const canvasId = ensureCanvas()
    update((draft) => {
      const canvas = draft.academics.classCenter.conceptCanvases.find((item) => item.id === canvasId)
      if (canvas) {
        canvas.attachedFileId = fileId === 'none' ? undefined : fileId
        canvas.updatedAt = Date.now()
      }
    })
  }
  function confirmProposal() {
    if (!proposalTopicId) return
    update((draft) => { draft.academics.classCenter.topicLinks = linkTopics(draft.academics.classCenter.topicLinks, { fromTopicId: topic.id, toTopicId: proposalTopicId, relation: proposalRelation }) })
    setProposalTopicId('')
  }

  return <section className="mt-3 rounded-2xl border border-white/14 bg-white/5 p-4">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-display text-lg font-extrabold">Optional concept canvas</p><p className="mt-1 text-sm font-semibold text-white/62">Text is still the default. Add only the nodes and labelled edges that help you explain this topic.</p></div><Button size="sm" variant="outline" className="border-white/18 bg-white/5 text-white" disabled={!edges.length} onClick={removeLastEdge}><Undo2 className="size-4" /> Undo edge</Button></div>
    <div className="mt-3 flex flex-wrap gap-2">{nodes.map((node) => <span key={node.id} className="rounded-lg border border-white/15 bg-slate-950/45 px-2 py-1 text-xs font-bold">{node.label}</span>)}{!nodes.length && <span className="text-sm font-semibold text-white/45">No nodes yet.</span>}</div>
    {edges.length > 0 && <div className="mt-3 space-y-1.5">{edges.map((edge) => <p key={edge.id} className="text-xs font-semibold text-white/70">{nodes.find((node) => node.id === edge.fromNodeId)?.label} <span className="text-primary">— {edge.label} →</span> {nodes.find((node) => node.id === edge.toNodeId)?.label}</p>)}</div>}
    <div className="mt-4 grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]"><Input value={nodeLabel} onChange={(event) => setNodeLabel(event.target.value)} placeholder="Add a text node" className="border-white/15 bg-white/7 text-white" /><Button size="sm" variant="outline" className="border-white/18 bg-white/5 text-white" onClick={addNode}><Plus className="size-4" /> Add node</Button></div>
    <div className="mt-2 grid gap-2 md:grid-cols-4"><Select value={fromNodeId} onValueChange={setFromNodeId}><SelectTrigger className="border-white/15 bg-white/7 text-white"><SelectValue placeholder="From" /></SelectTrigger><SelectContent>{nodes.map((node) => <SelectItem key={node.id} value={node.id}>{node.label}</SelectItem>)}</SelectContent></Select><Input value={edgeLabel} onChange={(event) => setEdgeLabel(event.target.value)} placeholder="Relation label" className="border-white/15 bg-white/7 text-white" /><Select value={toNodeId} onValueChange={setToNodeId}><SelectTrigger className="border-white/15 bg-white/7 text-white"><SelectValue placeholder="To" /></SelectTrigger><SelectContent>{nodes.map((node) => <SelectItem key={node.id} value={node.id}>{node.label}</SelectItem>)}</SelectContent></Select><Button size="sm" variant="outline" className="border-white/18 bg-white/5 text-white" disabled={!fromNodeId || !toNodeId || !edgeLabel.trim()} onClick={addEdge}>Add edge</Button></div>
    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-white/14 bg-white/[0.035] p-3"><p className="text-sm font-extrabold">Attach map</p><Select value={existing?.attachedFileId ?? ''} onValueChange={attachSavedFile}><SelectTrigger className="h-9 min-w-52 border-white/15 bg-white/7 text-white"><SelectValue placeholder="Optional saved class file" /></SelectTrigger><SelectContent><SelectItem value="none">No saved file</SelectItem>{mapFiles.map((file) => <SelectItem key={file.id} value={file.id}>{file.title}</SelectItem>)}</SelectContent></Select><p className="text-xs font-semibold text-white/50">Optional reference only.</p></div>
    <div className="mt-4 border-t border-white/12 pt-3"><p className="text-sm font-extrabold">Propose a topic relation</p><p className="mt-1 text-xs font-semibold text-white/55">The proposal changes nothing until you confirm it.</p><div className="mt-2 grid gap-2 md:grid-cols-3"><Select value={proposalTopicId} onValueChange={setProposalTopicId}><SelectTrigger className="border-white/15 bg-white/7 text-white"><SelectValue placeholder="Another topic" /></SelectTrigger><SelectContent>{otherTopics.map((item) => <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>)}</SelectContent></Select><Select value={proposalRelation} onValueChange={(value) => setProposalRelation(value as TopicLinkRelation)}><SelectTrigger className="border-white/15 bg-white/7 text-white"><SelectValue /></SelectTrigger><SelectContent>{TOPIC_LINK_RELATIONS.map((relation) => <SelectItem key={relation} value={relation}>{RELATION_LABEL[relation]}</SelectItem>)}</SelectContent></Select><Button size="sm" disabled={!proposalTopicId} onClick={confirmProposal}><GitBranchPlus className="size-4" /> Confirm relation</Button></div></div>
  </section>
}
