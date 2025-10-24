import { BrowserRouter, Routes, Route } from "react-router-dom"
import HomePage from './pages/home_page/homepage.jsx'
import Login from './pages/login_page/login.jsx'
import Notifications from './pages/notifications/notification.jsx'
import ItemDetails from './pages/catalog_page/item_details.jsx'
import SearchResults from './pages/catalog_page/search_results.jsx'
import ManageUsers from './pages/main_staff_page/manage_users.jsx'
import UserProfile from './pages/main_staff_page/user_profile.jsx'
import AccountDashboard from './pages/account_dashboard/AccountDashboard.jsx';
import Register from './pages/register_page/register.jsx';
import Navbar from './pages/navbar/navbar.jsx';
import { useState } from 'react';
import './App.css'

function App() {
  const [isStaff, setIsStaff] = useState(true);

  return (
    <BrowserRouter>
      <Navbar isStaff={isStaff} setIsStaff={setIsStaff} />
      <Routes>
        {/* USERS */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/notifications" element={<Notifications />} />

        <Route path="/item-details" element={<ItemDetails isStaff={isStaff} />} />
        <Route path="/search-results" element={<SearchResults isStaff={isStaff} />} />
        <Route path="/account" element={<AccountDashboard />} />
        {/* ADMIN */}
        <Route path="/manage-users" element={<ManageUsers />} />
        <Route path="/user" element={<UserProfile />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App