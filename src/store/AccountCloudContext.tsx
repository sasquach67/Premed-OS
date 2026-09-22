import { createContext, useContext } from 'react'
import type { useCloudSync } from './useCloudSync'

/** The app shell owns sync. Route sections observe it without restarting it. */
export const AccountCloudContext = createContext<ReturnType<typeof useCloudSync> | null>(null)
export function useAccountCloud() {
  const cloud = useContext(AccountCloudContext)
  if (!cloud) throw new Error('Account sync must be observed inside the app shell.')
  return cloud
}
