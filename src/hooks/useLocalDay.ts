import { useEffect, useState } from 'react'
import { localDay } from '@/lib/research'

/** Refresh date-sensitive selectors at midnight and after a sleeping/background tab wakes. */
export function useLocalDay() {
  const [day, setDay] = useState(() => localDay())
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const refresh = () => {
      clearTimeout(timer)
      setDay(localDay())
      const midnight = new Date()
      midnight.setHours(24, 0, 0, 0)
      timer = setTimeout(refresh, Math.max(1, midnight.getTime() - Date.now()))
    }
    refresh()
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])
  return day
}
