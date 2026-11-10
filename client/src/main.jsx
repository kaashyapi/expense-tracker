import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.jsx'
import './index.css'

async function startApp() {
  let clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

  // Dynamically query API config from FastAPI backend if available
  try {
    const backendBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
    const configUrl = backendBase ? `${backendBase}/api/auth/config` : '/api/auth/config'
    const res = await fetch(configUrl)
    if (res.ok) {
      const data = await res.json()
      if (data.google_client_id) {
        clientId = data.google_client_id
      }
    }
  } catch (err) {
    // Network or offline fallback
  }

  const isConfigured = Boolean(clientId && !clientId.includes('dummy'))
  const activeClientId = isConfigured
    ? clientId
    : '783092088397-l23dpcb8edam3fnvr3tc7mq7b8norvjn.apps.googleusercontent.com'

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <GoogleOAuthProvider clientId={activeClientId}>
        <App isGoogleConfigured={isConfigured} />
      </GoogleOAuthProvider>
    </React.StrictMode>,
  )
}

startApp()
