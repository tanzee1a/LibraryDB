import { BrowserRouter, Routes, Route } from "react-router-dom"
import HomePage from './pages/home_page/homepage.jsx'
import Login from './pages/login_page/login.jsx'
import Notifications from './pages/notifications/notification.jsx'
import Profile from './pages/profile_page/profile.jsx'
import Catalog from './pages/catalog_page/catalog.jsx'
import './App.css'
import AccountDashboard from './account_dashboard/AccountDashboard';

function App() {

  return (
    <BrowserRouter>
      <Routes>
        {/* USERS */}
        {/* Homepage may need a different navbar view later*/}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/account" element={<AccountDashboard />} />
        {/* ADMIN */}
      </Routes>
    </BrowserRouter>
    
  )
}

export default App