import type { ReactNode } from 'react'
import { Copy, Download, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import './NotebookAIFlow.css'

export function NotebookAIFlow({ gather, copy, bring, help, reviewing = false, bringTitle = 'Bring it back' }: { gather: ReactNode; copy: ReactNode; bring: ReactNode; help: ReactNode; reviewing?: boolean; bringTitle?: string }) {
  return <div className={`notebook-ai-flow${reviewing ? ' nai-reviewing' : ''}`}><ol className="nai-steps">
    {[['Gather your files', gather], ['Copy the prompt into a new AI chat', copy], [bringTitle, bring]].map(([title, body], index) => <li className="nai-step" hidden={reviewing && index < 2} key={index}><span className="nai-number" hidden={reviewing} aria-hidden="true">{index + 1}</span><div className="nai-step-body"><h2 hidden={reviewing}>{title}</h2>{body}</div></li>)}
  </ol><details className="nai-help" hidden={reviewing}><summary>If something goes wrong</summary>{help}</details></div>
}

export function NotebookAICopy({ flashcards = false, copyBusy, disabled, onCopy, onDownload, onView, children }: { flashcards?: boolean; copyBusy: boolean; disabled?: boolean; onCopy: () => void; onDownload: () => void; onView: () => void; children?: ReactNode }) {
  return <><div className="nai-actions"><Button disabled={copyBusy || disabled} onClick={onCopy}><Copy aria-hidden="true" />{copyBusy ? 'Copying…' : 'Copy prompt'}</Button><Button variant="ghost" disabled={disabled} onClick={onDownload}><Download aria-hidden="true" />Download</Button><Button variant="ghost" disabled={disabled} onClick={onView}><Eye aria-hidden="true" />View</Button></div>
    <div className="nai-expect"><ol><li>Open a new chat in ChatGPT, Claude or another AI.</li><li>Paste the prompt and attach your files.</li><li>{flashcards ? 'When it finishes, it gives you an .apkg file.' : 'Give it about 15–20 minutes. It saves the folder in your class folder.'}</li></ol><p>Premed OS never sees the chat. Check the AI’s work before saving.</p></div>{children}</>
}
