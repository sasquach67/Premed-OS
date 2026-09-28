import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import '../../src/index.css'
import { QuarterlyGoalsPanel } from '../../src/components/overview/OverviewSupport'
import { ToastContext } from '../../src/components/common/toast-context'
import { createPersonalInitialData } from '../../src/data/personalInitialData'
import { useStore } from '../../src/store/store'
if (location.hostname !== '127.0.0.1' || location.port !== '5294') throw new Error('Synthetic review only')
useStore.setState({ ...createPersonalInitialData(), quarterlyGoals: Array.from({length:4}, (_,i)=>({ id:`test-${i}`, text: i===0 ? 'Synthetic long goal that wraps across multiple lines in this narrow card' : `Synthetic existing goal ${i+1}`, quarter:'Current term', kind:'check-off' as const, done:false, order:i })) })
createRoot(document.getElementById('root')!).render(<MemoryRouter><ToastContext.Provider value={{toast:()=> 'test'}}><main style={{maxWidth:390,margin:'24px auto',padding:12}}><QuarterlyGoalsPanel /></main></ToastContext.Provider></MemoryRouter>)
