import { BrowserRouter, Routes, Route } from "react-router-dom"
import HomePage from './pages/home_page/homepage.jsx'
import Login from './pages/login_page/login.jsx'
import Notifications from './pages/notifications/notification.jsx'
import ItemDetails from './pages/catalog_page/item_details.jsx'
import SearchResults from './pages/catalog_page/search_results.jsx'
import AccountDashboard from './pages/account_dashboard/AccountDashboard.jsx';
import Register from './pages/register_page/register.jsx';
import Navbar from './pages/navbar/navbar.jsx';
import { useState } from 'react';
import './App.css'

function App() {
  const [isStaff, setIsStaff] = useState(false);

  return (
    <BrowserRouter>
      <Navbar isStaff={isStaff} setIsStaff={setIsStaff} />
      <Routes>
        {/* USERS */}
        {/* Homepage may need a different navbar view later*/}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/item-details" element={<ItemDetails isStaff={isStaff} />} />
        <Route path="/search-results" element={<SearchResults />} />
        <Route path="/account" element={<AccountDashboard />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/notifications" element={<Notifications />} />
        {/* ADMIN */}
      </Routes>
    </BrowserRouter>
  )
}

export default App