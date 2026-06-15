import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import './i18n/i18n'
import App from './App.tsx'

// Aggiornamento forzato. Con registerType 'autoUpdate' un nuovo service worker
// si attiva subito e ricarica la pagina. Qui aggiungiamo un controllo periodico
// (ogni 60 s) e un controllo quando la scheda torna in primo piano, così anche
// una scheda lasciata aperta scarica la nuova versione senza ricaricare a mano.
// Nota: questo non cancella IndexedDB, quindi i progetti salvati restano intatti.
const updateSW = registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return
    const check = () => void registration.update()
    setInterval(check, 60 * 1000)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check()
    })
  },
  onNeedRefresh() {
    // Fallback di sicurezza: con autoUpdate di norma non viene chiamato.
    void updateSW(true)
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
