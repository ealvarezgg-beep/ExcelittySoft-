import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import TenantAdmin from './pages/TenantAdmin'
import SuperAdmin from './pages/SuperAdmin'
import Login from './pages/Login'
import PublicBooking from './pages/PublicBooking'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<TenantAdmin />} />
        <Route path="/super-admin" element={<SuperAdmin />} />
        <Route path="/book/:slug" element={<PublicBooking />} />
        {/* Redirect unknown routes to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
