import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route, Link, Navigate, useParams } from 'react-router-dom'
import { useStore, createInitialDataForMode } from '../../src/store/store'
import { ClassHub } from '../../src/components/academics/ClassHub'
import { JournalEntryPage } from '../../src/pages/JournalEntryPage'
import { ToastProvider } from '../../src/components/common/ToastProvider'
import { Button } from '../../src/components/ui/button'
import '../../src/index.css'
// Dev-only review surface: actual app components and actual store, isolated localhost origin.
// No real materials, provider requests, account sign-in, or production data.
if (!import.meta.env.DEV && import.meta.env.VITE_NOTEBOOK_REVIEW !== '1') throw new Error('This review surface is development-only.')
const id = 'notebook-demo'
if (!useStore.getState().courses.some(c => c.id === id)) {
  const data = createInitialDataForMode(false)
  data.courses = [{ id, term: 'Fall 2026', code: 'BIOL 103', title: 'How Cells Function', credits: 3, grade: '', bcpm: false, status: 'in-progress', inResidence: true, satisfies: [], order: 0 }]
  useStore.getState().replaceAll(data)
  useStore.getState().update(state => {
    const workspace = state.academics.classCenter.workspaces.find(w => w.courseId === id)
    if (workspace) { workspace.color = 'mint'; workspace.instructor = 'Example instructor'; workspace.meetingDays = 'Tue, Thu'; workspace.meetingTime = '12:30-1:45 PM'; workspace.location = 'Example classroom' }
    state.academics.classCenter.lectures.push({ id: 'example-existing', courseId: id, title: 'Notebook entry 1', notebookGoal: 'review', notebookRequest: 'Example saved draft', inputPath: 'materials', processingState: 'ready', workspaceState: 'draft', occurredOn: '2026-09-06', createdAt: Date.now()-86400000, updatedAt: Date.now()-86400000, order: 0 })
  })
}
function Hub() { const { courseId } = useParams(); const course = useStore(s => s.courses.find(c => c.id === courseId)); const data = useStore(s => s.academics.classCenter); const workspace = data.workspaces.find(w => w.courseId === courseId); return course && workspace ? <ClassHub course={course} workspace={workspace} data={data} persons={[]} /> : <p>Class unavailable</p> }
function ClassCards() { return <section className="p-8"><h1 className="font-display text-3xl font-bold">Classes</h1><Link to={`/academics/classes/${id}`}><Button className="mt-6">BIOL 103 / How Cells Function / Open class notebook</Button></Link></section> }
createRoot(document.getElementById('root')!).render(<React.StrictMode><HashRouter><ToastProvider>
  <aside aria-label="About this preview" className="border-b border-border bg-muted/40 px-6 py-4 sm:px-10">
    <div className="flex flex-wrap items-center justify-between gap-3"><strong>Example-class interface preview</strong><Link className="text-sm font-bold text-primary underline" to={`/academics/classes/${id}/journal/new`}>Start at goal selection</Link></div>
    <p className="mt-2 text-sm leading-6">See how the notebook workflow will look in Premed OS. First, choose a goal below and click <b>View full prompt</b>.</p>
    <p className="mt-1 text-sm leading-6 text-muted-foreground">This BIOL 103 class is an example, not your class workspace. You do not need to inspect or import a sample notebook to test the instructions in your own AI chat.</p>
  </aside>
  <main className="min-h-screen p-3 sm:p-6"><Routes><Route path="/academics/classes/:courseId" element={<Hub />} /><Route path="/academics/classes/:courseId/journal/:entryId" element={<JournalEntryPage />} /><Route path="/academics/classes/:courseId/lectures/:entryId" element={<JournalEntryPage />} /><Route path="/academics" element={<ClassCards />} /><Route path="*" element={<Navigate to={`/academics/classes/${id}/journal/new`} replace />} /></Routes></main>
</ToastProvider></HashRouter></React.StrictMode>)
