import { BrowserRouter, Routes, Route } from "react-router-dom"
import HomePage from './pages/home_page/homepage.jsx'
import Login from './pages/login_page/login.jsx'
import Notifications from './pages/notifications/notification.jsx'
import ItemDetails from './pages/catalog_page/item_details.jsx'
import SearchResults from './pages/catalog_page/search_results.jsx'
import UserProfile from './pages/main_staff_page/user_profile.jsx'
import ManageUsers from './pages/main_staff_page/manage_users.jsx'
import ManageBorrows from './pages/main_staff_page/manage_borrows.jsx'
import ManageHolds from './pages/main_staff_page/manage_holds.jsx'
import ManageFines from './pages/main_staff_page/manage_fines.jsx'
import AccountDashboard from './pages/account_dashboard/AccountDashboard.jsx';
import Register from './pages/register_page/register.jsx';
import Navbar from './pages/navbar/navbar.jsx';

import StaffPage from '.pages/staff_page/staff_page.jsx' // another 'main' page, probably beyond redundant
import StaffFineForm from '.pages/staff_page/pay_fine_staff.jsx'
import NewItemForm from '.pages/staff_page/new_item_form.jsx'
import NewFineForm from '.pages/staff_page/new_fine_form.jsx'
import ReportForm from '.pages/staff_page/make_report_form.jsx'
import ItemHoldForm from '.pages/staff_page/item_put_hold.jsx'
import ItemHoldRemoveForm from '.pages/staff_page/item_end_hold.jsx'
import ItemEditStart from '.pages/staff_page/edit_item_form.jsx' //also probably redundant, it was meant to pull an item by ID and then go to the form below for whatever item type it is
import EditBook from '.pages/staff_page/edit_book_form.jsx'
import EditMedia from '.pages/staff_page/edit_media_form.jsx'
import EditDevice from '.pages/staff_page/edit_device_form.jsx'
import PayFineUser from '.pages/user_pay_fine/pay_fine_user.jsx'

import { useState, useEffect } from 'react';
import './App.css'

function App() {
  const [isStaff, setIsStaff] = useState(() => {
    // Load saved value (if any)
    const saved = localStorage.getItem('isStaff');
    return saved ? JSON.parse(saved) : false; // default to false
  });

  useEffect(() => {
    // Save value whenever it changes
    localStorage.setItem('isStaff', JSON.stringify(isStaff));
  }, [isStaff]);

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
        <Route path="/user" element={<UserProfile />} />
        <Route path="/manage-users" element={<ManageUsers />} />
        <Route path="/manage-borrows" element={<ManageBorrows />} />
        <Route path="/manage-holds" element={<ManageHolds />} />
        <Route path="/manage-fines" element={<ManageFines />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App