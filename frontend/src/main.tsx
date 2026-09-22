import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { initializeStorage } from './services/electionStorage'
import { initializeVoterStorage } from './services/voterStorage'
import { initializeAuditStorage } from './services/auditStorage'

initializeStorage()
initializeVoterStorage()
initializeAuditStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
