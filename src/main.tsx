import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { FeaturesProvider } from './lib/FeaturesContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FeaturesProvider>
      <App />
    </FeaturesProvider>
  </React.StrictMode>,
)
