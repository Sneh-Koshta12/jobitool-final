import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css' // <--- IF THIS IS MISSING, TAILWIND WILL NEVER LOAD
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)