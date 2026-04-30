import { Buffer } from 'buffer';
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Polyfill Buffer for Stellar SDK
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  window.global = window;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
