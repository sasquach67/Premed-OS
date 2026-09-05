import { createContext } from 'react'
import type { ConfirmInput } from '@/components/common/ConfirmProvider'

export const ConfirmContext = createContext<((input: ConfirmInput) => Promise<boolean>) | null>(null)
