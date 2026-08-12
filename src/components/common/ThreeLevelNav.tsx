import { Search } from 'lucide-react'
import type { ReactNode } from 'react'
import { useId } from 'react'

import { ModeSwitch } from '@/components/common/ModeSwitch'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

export interface ThreeLevelNavTab {
  id: string
  label: string
  count?: number
  icon?: ReactNode
}

export interface ThreeLevelNavMode {
  id: string
  label: string
  tabs: ThreeLevelNavTab[]
}

export interface ThreeLevelNavOption {
  value: string
  label: string
}

export interface ThreeLevelNavView extends ThreeLevelNavOption {
  icon?: ReactNode
}

interface ThreeLevelNavProps {
  modes: [ThreeLevelNavMode, ThreeLevelNavMode]
  activeMode: string
  onModeChange: (mode: string) => void
  activeTab: string
  onTabChange: (tab: string) => void
  period: {
    label: string
    value: string
    options: ThreeLevelNavOption[]
    onChange: (value: string) => void
  }
  search: {
    label: string
    placeholder: string
    value: string
    onChange: (value: string) => void
  }
  views: {
    label: string
    value: string
    options: ThreeLevelNavView[]
    onChange: (value: string) => void
  }
  resultCount: number
  resultNoun: {
    singular: string
    plural: string
  }
  className?: string
}

export function tabsForMode(modes: ThreeLevelNavMode[], activeMode: string) {
  return modes.find((mode) => mode.id === activeMode)?.tabs ?? modes[0]?.tabs ?? []
}

/**
 * The shared three-level navigation grammar from 01 §4b-i.
 *
 * Level 1 changes product mode, Level 2 changes the product view within that
 * mode, and Level 3 filters or changes the representation of that view. This
 * component owns the geometry so feature pages only supply configuration.
 */
export function ThreeLevelNav({
  modes,
  activeMode,
  onModeChange,
  activeTab,
  onTabChange,
  period,
  search,
  views,
  resultCount,
  resultNoun,
  className,
}: ThreeLevelNavProps) {
  const searchId = useId()
  const tabs = tabsForMode(modes, activeMode)
  const countCopy = resultCount === 0
    ? `No ${resultNoun.plural} yet.`
    : `${resultCount} ${resultCount === 1 ? resultNoun.singular : resultNoun.plural}`

  return (
    <nav aria-label="View navigation" className={cn('space-y-3', className)}>
      <div data-navigation-level="1">
        <ModeSwitch
          value={activeMode}
          options={modes}
          onChange={onModeChange}
          label="Product mode"
        />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={onTabChange}
        data-navigation-level="2"
      >
        <TabsList className="h-auto w-full justify-start gap-5 rounded-none border-x-0 border-t-0 bg-transparent p-0">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                'relative gap-2 rounded-none border-0 bg-transparent px-1 pb-3 pt-2 shadow-none transition-colors duration-150 ease-out',
                'after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:origin-center after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform after:duration-150 after:ease-out',
                'hover:bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:scale-x-100',
                'motion-reduce:transition-none motion-reduce:after:transition-none',
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count != null && (
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-muted-foreground">
                  {tab.count}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card data-navigation-level="3" className="p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Select value={period.value} onValueChange={period.onChange}>
            <SelectTrigger aria-label={period.label} className="w-full lg:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {period.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative min-w-0 flex-1">
            <label htmlFor={searchId} className="sr-only">{search.label}</label>
            <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id={searchId}
              type="search"
              value={search.value}
              onChange={(event) => search.onChange(event.currentTarget.value)}
              placeholder={search.placeholder}
              className="pl-9"
            />
          </div>

          <p aria-live="polite" className="shrink-0 text-sm font-semibold text-muted-foreground">
            {countCopy}
          </p>

          <ToggleGroup
            type="single"
            value={views.value}
            onValueChange={(value) => value && views.onChange(value)}
            aria-label={views.label}
            variant="outline"
            className="shrink-0"
          >
            {views.options.map((view) => (
              <ToggleGroupItem key={view.value} value={view.value} aria-label={view.label} className="gap-2">
                {view.icon}
                <span className="hidden sm:inline">{view.label}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </Card>
    </nav>
  )
}
