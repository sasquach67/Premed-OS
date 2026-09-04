import { useState } from 'react'
import { Download } from 'lucide-react'
import type { GeneratedUnitQuestionBank } from '@/lib/types'
import { downloadQuestionBankPdf } from '@/lib/academics/questionBankPdf'
import { useToast } from '@/components/common/useToast'
import { Button } from '@/components/ui/button'

export function QuestionBankPdfButton({ bank, className }: { bank: GeneratedUnitQuestionBank; className?: string }) {
  const toast = useToast()
  const [creating, setCreating] = useState(false)

  async function download() {
    if (creating) return
    setCreating(true)
    try {
      await downloadQuestionBankPdf(bank)
      toast({ title: 'PDF ready', description: 'Questions, stimuli, and the answer key were downloaded.' })
    } catch (error) {
      toast({ title: 'PDF could not be created', description: error instanceof Error ? error.message : 'Try the download again.', tone: 'error' })
    } finally {
      setCreating(false)
    }
  }

  return <Button className={className} size="sm" variant="outline" disabled={creating} onClick={() => void download()}><Download className="size-4" /> {creating ? 'Building PDF...' : 'Download PDF'}</Button>
}
