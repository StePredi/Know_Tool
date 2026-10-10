import '@fontsource/atkinson-hyperlegible/400.css'
import '@fontsource/atkinson-hyperlegible/700.css'
import '@fontsource/lexend/400.css'
import '@fontsource/lexend/500.css'
import '@fontsource/lexend/600.css'
import '@fontsource/lexend/700.css'
import './index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { Errori } from './componenti/Errori'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Errori>
      <App />
    </Errori>
  </StrictMode>
)
