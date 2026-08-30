/* ============================================================
   GuidedTour — a live, contained product preview.

   This is deliberately DOM, not a captured image. The preview is a small
   read-only version of the product's information architecture: visitors can
   change the section and scroll through it without leaving the landing page.
   It never reads or writes a visitor's real workspace.
   ============================================================ */
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, UIEvent } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  GraduationCap,
  LayoutDashboard,
} from 'lucide-react'
import { PublicHeadline } from '@/components/public/PublicHeadline'

function GuideFigure() {
  return (
    <span className="pl-guide" aria-hidden="true">
      <img src={`${import.meta.env.BASE_URL}art/mascot.gif`} alt="" width={40} height={40} />
    </span>
  )
}

type PreviewTab = 'Overview' | 'Academics'

const PREVIEW_NAV: { label: PreviewTab; icon: typeof LayoutDashboard }[] = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Academics', icon: GraduationCap },
]

const PREVIEW_COPY: Record<PreviewTab, { eyebrow: string; title: string; subline: string }> = {
  Overview: {
    eyebrow: 'Wednesday, August 12',
    title: 'Good to see you again, Andy.',
    subline: 'The few things that need your attention today.',
  },
  Academics: {
    eyebrow: 'Fall 2026 · 3 classes',
    title: 'Academics',
    subline: 'Your courses, grades and next steps for the term.',
  },
}

function OverviewContent() {
  return (
    <>
      <div className="pl-live-hero">
        <div className="pl-live-next">
          <span className="pl-live-mini">Next up</span>
          <b>CHEM 101 lecture</b>
          <strong>6:33:54</strong>
          <span className="pl-live-progress"><i /></span>
        </div>
        <div className="pl-live-day">
          <div className="pl-live-dayhead"><span>Today</span><CalendarDays aria-hidden="true" /></div>
          <div className="pl-live-event"><time>9 AM</time><b>CHEM 101 lecture</b><span>9:50 AM</span></div>
          <div className="pl-live-event"><time>11 AM</time><b>Neuroscience seminar</b><span>12:15 PM</span></div>
          <div className="pl-live-event"><time>3 PM</time><b>Research lab</b><span>7 PM</span></div>
        </div>
      </div>
      <PreviewSection title="Smart next actions" action="3 ready">
        <div className="pl-live-actiongrid">
          <PreviewAction title="Add a verifier" detail="UNC Family Medicine has active hours with no contact yet." />
          <PreviewAction title="Plan problem set 7" detail="CHEM 262 is due tomorrow at 11:59 PM." />
        </div>
      </PreviewSection>
      <div className="pl-live-split">
        <PreviewSection title="Tasks" action="Add task"><PreviewList rows={['Review amino acids', 'Confirm Thursday shift', 'Read ENGL 105 essay feedback']} /></PreviewSection>
        <PreviewSection title="Where I stand"><PreviewList rows={['Academics · 3.67', 'Classes · 3 this term', 'Tasks · 3 ready']} /></PreviewSection>
      </div>
    </>
  )
}

function AcademicsContent() {
  return (
    <>
      <div className="pl-live-mode" aria-label="Academics mode preview">
        <span className="is-active">Daily</span><span>Planning</span>
      </div>
      <div className="pl-live-kpis pl-live-kpis-academics">
        <PreviewMetric label="Term GPA" value="3.67" tone="blue" />
        <PreviewMetric label="Cumulative" value="3.67" tone="blue" />
        <PreviewMetric label="Due today" value="1" tone="amber" />
        <PreviewMetric label="Lectures" value="3" />
      </div>
      <div className="pl-live-subtabs" aria-label="Academics workspace preview"><b>Class center <span>3</span></b><span>Assignments <i>4</i></span></div>
      <PreviewSection title="Your classes" action="Add class">
        <div className="pl-live-courses">
          <PreviewCourse code="CHEM 262" title="Organic Chemistry II" detail="1 assignment due · 2 lectures" tone="blue" />
          <PreviewCourse code="ENGL 105" title="Writing in Health & Medicine" detail="1 assignment due · Class notes ready" tone="violet" />
          <PreviewCourse code="NSCI 222" title="Introduction to Neuroscience" detail="No work due today" tone="green" />
        </div>
      </PreviewSection>
      <PreviewSection title="Coming up"><PreviewList rows={['Thu · CHEM 262 problem set', 'Fri · ENGL 105 revision', 'Sep 2 · CHEM 262 exam']} /></PreviewSection>
    </>
  )
}

function PreviewMetric({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return <div className={`pl-live-metric${tone ? ` is-${tone}` : ''}`}><span>{label}</span><b>{value}</b></div>
}

function PreviewAction({ title, detail }: { title: string; detail: string }) {
  return <div className="pl-live-action"><span className="pl-live-actionicon"><CircleDot aria-hidden="true" /></span><b>{title}</b><p>{detail}</p><button type="button">Open <ChevronRight aria-hidden="true" /></button></div>
}

function PreviewCourse({ code, title, detail, tone }: { code: string; title: string; detail: string; tone: string }) {
  return <div className={`pl-live-course is-${tone}`}><span className="pl-live-coursemark" /><div><small>{code}</small><b>{title}</b><p>{detail}</p></div><ChevronRight aria-hidden="true" /></div>
}

function PreviewList({ rows }: { rows: string[] }) {
  return <div className="pl-live-list">{rows.map((row) => <div key={row}><CheckCircle2 aria-hidden="true" /><span>{row}</span><ChevronRight aria-hidden="true" /></div>)}</div>
}

function PreviewSection({ title, action, children }: { title: string; action?: string; children: React.ReactNode }) {
  return <section className="pl-live-section"><div className="pl-live-sectionhead"><h3>{title}</h3>{action ? <button type="button">{action}</button> : null}</div>{children}</section>
}

function LivePreview({ tab, onProgress, onSelect }: { tab: PreviewTab; onProgress: (progress: number) => void; onSelect: (tab: PreviewTab) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'auto' })
    onProgress(0)
  }, [tab, onProgress])

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget
    const range = element.scrollHeight - element.clientHeight
    onProgress(range > 0 ? element.scrollTop / range : 0)
  }

  const copy = PREVIEW_COPY[tab]
  return (
    <div className="pl-live-app" aria-label={`Interactive ${tab} product preview`}>
      <aside className="pl-live-rail" aria-label="Demo navigation">
        <span className="pl-live-mark" aria-hidden="true"><i /><i /><i /></span>
        <div className="pl-live-railnav">
          {PREVIEW_NAV.map(({ label, icon: Icon }) => <button key={label} type="button" className={label === tab ? 'is-active' : ''} aria-label={`Show ${label} preview`} aria-pressed={label === tab} onClick={() => onSelect(label)}><Icon aria-hidden="true" /></button>)}
        </div>
        <span className="pl-live-avatar" aria-hidden="true">A</span>
      </aside>
      <div className="pl-live-workspace" ref={scrollRef} onScroll={handleScroll} tabIndex={0}>
        <header className="pl-live-topbar"><span>{tab}</span><span className="pl-live-search">Search or run a command…</span><span className="pl-live-notice"><Clock3 aria-hidden="true" />6 to review</span></header>
        <div className="pl-live-content">
          <header className="pl-live-title"><span>{copy.eyebrow}</span><h2>{copy.title}</h2><p>{copy.subline}</p></header>
          {tab === 'Overview' ? <OverviewContent /> : null}
          {tab === 'Academics' ? <AcademicsContent /> : null}
        </div>
      </div>
    </div>
  )
}

interface Callout {
  pin: { left: string; top: string }
  at: CSSProperties
  lead: string
  body: string
}

interface TourStep {
  tab: PreviewTab
  callouts: Callout[]
}

const STEPS: TourStep[] = [
  { tab: 'Overview', callouts: [
    { pin: { left: '21%', top: '24%' }, at: { left: '4%', top: '31%' }, lead: 'Start here.', body: 'Overview gathers the few things that need you today.' },
    { pin: { left: '73%', top: '50%' }, at: { right: '3%', top: '56%' }, lead: 'Act with context.', body: 'Each next action says why it surfaced, so it is never just another notification.' },
  ] },
  { tab: 'Academics', callouts: [
    { pin: { left: '24%', top: '29%' }, at: { left: '4%', top: '35%' }, lead: 'A course is a home base.', body: 'Classes hold the schedule, materials and work that belong together.' },
    { pin: { left: '66%', top: '54%' }, at: { right: '3%', top: '60%' }, lead: 'Plan without losing the record.', body: 'Your course details carry into the GPA and planning views instead of being rebuilt later.' },
  ] },
]

export function GuidedTour() {
  const [active, setActive] = useState(0)
  const [progress, setProgress] = useState(0)
  const [openCallout, setOpenCallout] = useState<number | null>(null)
  const step = STEPS[active]
  const visibleCalloutCount = Math.min(step.callouts.length, 1 + Math.floor(progress * step.callouts.length))

  const selectTab = (tab: PreviewTab) => {
    const index = STEPS.findIndex((step) => step.tab === tab)
    if (index >= 0) {
      setActive(index)
      setOpenCallout(null)
    }
  }

  return (
    <section className="pl-tour" aria-labelledby="tour-heading">
      <div className="pl-tourin pl-reveal">
        <span className="pl-eyebrow pl-eyebrow-solid">A look inside</span>
        <PublicHeadline id="tour-heading" setup="This is what it looks like" payoff="when it's yours." size="section" tone="page" />

        <div className="pl-tourtabs" role="tablist" aria-label="Product preview sections">
          {STEPS.map((step, index) => <button key={step.tab} type="button" role="tab" className="pl-ttab" aria-selected={index === active} onClick={() => setActive(index)}>{step.tab}</button>)}
        </div>

        <div className="pl-tourhint"><span>Try it</span> Choose a section or scroll inside the preview.</div>
        <div className="pl-shotstage pl-reveal">
          <div className="pl-shotwin"><LivePreview tab={step.tab} onProgress={setProgress} onSelect={selectTab} /></div>
          {step.callouts.map((callout, index) => {
            const visible = index < visibleCalloutCount
            const open = openCallout === index
            return (
              <div key={callout.lead}>
                <button
                  type="button"
                  className={`pl-pin${visible ? ' is-visible' : ''}`}
                  style={callout.pin}
                  aria-label={`${callout.lead} ${visible ? 'Show explanation' : 'Scroll the preview to reveal'}`}
                  aria-expanded={open}
                  disabled={!visible}
                  onClick={() => setOpenCallout(open ? null : index)}
                  onPointerEnter={() => setOpenCallout(index)}
                  onPointerLeave={() => setOpenCallout(null)}
                  onFocus={() => setOpenCallout(index)}
                  onBlur={() => setOpenCallout(null)}
                />
                {open ? <div className="pl-call" style={callout.at}><GuideFigure /><div className="pl-bubble"><b>{callout.lead}</b> {callout.body}</div></div> : null}
              </div>
            )
          })}
        </div>
        <p className="pl-tourfoot">Interactive demo data. Your workspace starts empty, and stays on your device until you say otherwise.</p>
      </div>
    </section>
  )
}
