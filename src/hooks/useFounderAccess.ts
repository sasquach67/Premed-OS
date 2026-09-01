import { useEffect, useState } from 'react'
import { checkFounderAccess } from '@/lib/founderAdmin'

export function useFounderAccess(enabled = true) {
  const [isFounder, setIsFounder] = useState(false)
  const [checking, setChecking] = useState(enabled)

  useEffect(() => {
    let current = true
    if (!enabled) {
      setIsFounder(false)
      setChecking(false)
      return () => { current = false }
    }
    setChecking(true)
    void checkFounderAccess().then((allowed) => {
      if (!current) return
      setIsFounder(allowed)
      setChecking(false)
    })
    return () => { current = false }
  }, [enabled])

  return { isFounder, checking }
}

