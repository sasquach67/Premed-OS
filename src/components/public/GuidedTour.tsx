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
  BookOpen,
  Brain,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  GraduationCap,
  LayoutDashboard,
  Stethoscope,
} from 'lucide-react'
import { PublicHeadline } from '@/components/public/PublicHeadline'

function GuideFigure() {
  return (
    <span className="pl-guide" aria-hidden="true">
      <img src={`${import.meta.env.BASE_URL}art/mascot.gif`} alt="" width={40} height={40} />
    </span>
  )
}

type PreviewTab = 'Overview' | 'Academics' | 'MCAT' | 'Clinical'

const PREVIEW_NAV: { label: PreviewTab; icon: typeof LayoutDashboard }[] = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Academics', icon: GraduationCap },
  { label: 'MCAT', icon: Brain },
  { label: 'Clinical', icon: Stethoscope },
]

const PREVIEW_COPY: Record<PreviewTab, { eyebrow: string; title: string; subline: string }> = {
  Overview: {
    eyebrow: 'Wednesday, August 12',
    title: 'Good to see you again, Andy.',
    subline: 'The few things that need your attention today.',
  },
  Academics: {
    eyebrow: 'Fall 2026 · 3 classes',
    title: 'Academics, in one place.',
    subline: 'Due dates, course material and the work behind your GPA.',
  },
  MCAT: {
    eyebrow: 'Your plan · 31 weeks',
    title: 'Study what will matter next.',
    subline: 'Your classes and MCAT plan share the same week.',
  },
  Clinical: {
    eyebrow: 'Clinical experience',
    title: 'Hours with a record behind them.',
    subline: 'Shifts, reflections and verification stay together.',
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
          <div className="pl-live-event"><time>3 PM</time><b>Clinical shift</b><span>7 PM</span></div>
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
        <PreviewSection title="Where I stand"><PreviewList rows={['Academics · 3.67', 'Clinical · 146 hrs', 'MCAT · plan begins Aug 24']} /></PreviewSection>
      </div>
    </>
  )
}

function AcademicsContent() {
  return (
    <>
      <div className="pl-live-kpis">
        <PreviewMetric label="Cumulative" value="3.67" tone="blue" />
        <PreviewMetric label="Term GPA" value="—" />
        <PreviewMetric label="Due this week" value="4" tone="amber" />
      </div>
      <PreviewSection title="Your classes" action="Add class">
        <div className="pl-live-courses">
          <PreviewCourse code="CHEM 262" title="Organic Chemistry II" detail="Problem set 7 · due tomorrow" tone="blue" />
          <PreviewCourse code="ENGL 105" title="Writing in Health & Medicine" detail="Revision notes · Friday" tone="violet" />
          <PreviewCourse code="NSCI 222" title="Introduction to Neuroscience" detail="Seminar reflection · next week" tone="green" />
        </div>
      </PreviewSection>
      <PreviewSection title="Coming up"><PreviewList rows={['Thu · CHEM 262 problem set', 'Fri · ENGL 105 revision', 'Mon · NSCI 222 reading response', 'Sep 2 · CHEM 262 exam']} /></PreviewSection>
    </>
  )
}

function McatContent() {
  return (
    <>
      <div className="pl-live-plan">
        <div><span className="pl-live-mini">This week</span><strong>6 hrs planned</strong><p>One plan across coursework and MCAT.</p></div>
        <span className="pl-live-ring">3/4</span>
      </div>
      <PreviewSection title="Return to these" action="View plan">
        <PreviewList rows={['Psych/soc · behavior change', 'Biochem · amino acids', 'CARS · passage reasoning']} />
      </PreviewSection>
      <PreviewSection title="Recent practice">
        <div className="pl-live-practice"><span>Biology drill</span><b>18 / 20</b><em>Reviewed</em></div>
        <div className="pl-live-practice"><span>CARS passage set</span><b>—</b><em>Planned</em></div>
      </PreviewSection>
    </>
  )
}

function ClinicalContent() {
  return (
    <>
      <div className="pl-live-kpis">
        <PreviewMetric label="Logged hours" value="146" tone="green" />
        <PreviewMetric label="This week" value="4" />
        <PreviewMetric label="Need a verifier" value="1" tone="amber" />
      </div>
      <PreviewSection title="Active positions" action="Add position">
        <PreviewCourse code="CAROLINA ED" title="Emergency Department Volunteer" detail="Thursday · 3 PM–7 PM" tone="green" />
        <PreviewCourse code="FAMILY MED" title="Clinic Volunteer" detail="Next shift · Aug 20" tone="blue" />
      </PreviewSection>
      <PreviewSection title="Keep while it is fresh">
        <div className="pl-live-reflection"><BookOpen aria-hidden="true" /><span>After a shift, log what you saw and why it mattered.</span><ChevronRight aria-hidden="true" /></div>
      </PreviewSection>
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
          {tab === 'MCAT' ? <McatContent /> : null}
          {tab === 'Clinical' ? <ClinicalContent /> : null}
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
    { pin: { left: '24%', top: '29%' }, at: { left: '4%', top: '35%' }, lead: 'One class, one hub.', body: 'Syllabus, due dates, files and feedback stay with the course.' },
    { pin: { left: '66%', top: '54%' }, at: { right: '3%', top: '60%' }, lead: 'The right GPA math.', body: 'Course details are carried forward rather than reconstructed later.' },
  ] },
  { tab: 'MCAT', callouts: [
    { pin: { left: '23%', top: '31%' }, at: { left: '4%', top: '38%' }, lead: 'One honest plan.', body: 'Classwork and prep draw from the same week instead of competing schedules.' },
    { pin: { left: '69%', top: '61%' }, at: { right: '3%', top: '67%' }, lead: 'Return to the miss.', body: 'A missed question turns into a specific next review, not a generic topic list.' },
  ] },
  { tab: 'Clinical', callouts: [
    { pin: { left: '26%', top: '31%' }, at: { left: '4%', top: '38%' }, lead: 'Hours with evidence.', body: 'Positions, shifts and verifier details stay connected from the start.' },
    { pin: { left: '70%', top: '60%' }, at: { right: '3%', top: '66%' }, lead: 'Reflect while it is fresh.', body: 'A short prompt makes the future application easier to write.' },
  ] },
]

export function GuidedTour() {
  const [active, setActive] = useState(0)
  const [progress, setProgress] = useState(0)
  const step = STEPS[active]
  const calloutIndex = Math.min(step.callouts.length - 1, Math.floor(progress * step.callouts.length))
  const callout = step.callouts[calloutIndex]

  const selectTab = (tab: PreviewTab) => {
    const index = STEPS.findIndex((step) => step.tab === tab)
    if (index >= 0) setActive(index)
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
          <span key={`pin-${callout.lead}`} className="pl-pin" style={callout.pin} aria-hidden="true" />
          <div key={callout.lead} className="pl-call" style={callout.at}><GuideFigure /><div className="pl-bubble"><b>{callout.lead}</b> {callout.body}</div></div>
        </div>
        <p className="pl-tourfoot">Interactive demo data. Your workspace starts empty, and stays on your device until you say otherwise.</p>
      </div>
    </section>
  )
}
