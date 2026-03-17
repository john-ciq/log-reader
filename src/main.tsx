import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { FeaturesProvider } from './lib/FeaturesContext'
import './index.css'

// In PWA/standalone mode, Ctrl+W would close the app window. Prevent it.
if (window.matchMedia('(display-mode: standalone)').matches) {
  window.addEventListener('keydown', e => {
    if (e.key === 'w' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FeaturesProvider>
      <App />
    </FeaturesProvider>
  </React.StrictMode>,
)
