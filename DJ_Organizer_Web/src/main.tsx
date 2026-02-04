import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Polyfill for Buffer and process for browser compatibility
import { Buffer } from 'buffer';
(window as any).Buffer = Buffer;
(window as any).process = {
  env: { },
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)