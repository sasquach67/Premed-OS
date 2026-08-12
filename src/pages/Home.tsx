import { SmartActionPanel } from '@/components/common/SmartActionPanel'
import { MascotNoteProvider } from '@/components/common/MascotNote'
import { OverviewHero } from '@/components/overview/OverviewHero'
import { OverviewRoadmap } from '@/components/overview/OverviewRoadmap'
import { GpaStatTile, HoursStatTile, McatStatTile, WhereIStand } from '@/components/overview/OverviewStatus'
import { ActivityAndCapture, QuarterlyGoalsPanel, QuickAccess } from '@/components/overview/OverviewSupport'
import { OverviewTasks } from '@/components/overview/OverviewTasks'
import { TemporaryAdvisingGuidance } from '@/components/overview/TemporaryAdvisingGuidance'
import { EqualHeightGrid } from '@/components/common/BoundedLayout'

export function Home() {
  return (
    <MascotNoteProvider>
      <div className="space-y-4">
        <OverviewHero />
        <SmartActionPanel />

        <EqualHeightGrid className="grid-cols-1 lg:grid-cols-6 xl:grid-cols-12">
          <div className="lg:col-span-6 xl:col-span-7"><OverviewTasks /></div>
          <div className="lg:col-span-6 xl:col-span-5"><WhereIStand /></div>

          <div className="lg:col-span-3 xl:col-span-3"><GpaStatTile /></div>
          <div className="lg:col-span-3 xl:col-span-3"><McatStatTile /></div>
          <div className="lg:col-span-6 xl:col-span-6"><HoursStatTile /></div>

          <div className="lg:col-span-3 xl:col-span-4"><QuickAccess /></div>
          <div className="order-last lg:order-none lg:col-span-3 xl:col-span-4"><QuarterlyGoalsPanel /></div>
          <div className="lg:col-span-3 xl:col-span-4"><ActivityAndCapture /></div>

          <div className="order-last lg:col-span-6 xl:col-span-12"><OverviewRoadmap /></div>
          <div className="order-last lg:col-span-6 xl:col-span-12"><TemporaryAdvisingGuidance /></div>
        </EqualHeightGrid>
      </div>
    </MascotNoteProvider>
  )
}
