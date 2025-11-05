import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from './pages/home_page/homepage.jsx';
import Login from './pages/authentication_page/login.jsx';
import Register from './pages/authentication_page/register.jsx';
import Notifications from './pages/notifications/notification.jsx';
import ItemDetails from './pages/catalog_page/item_details.jsx';
import SearchResults from './pages/catalog_page/search_results.jsx';
import UserProfile from './pages/main_staff_page/user_profile.jsx';
import ManageUsers from './pages/main_staff_page/manage_users.jsx';
import ManageBorrows from './pages/main_staff_page/manage_borrows.jsx';
import ManageHolds from './pages/main_staff_page/manage_holds.jsx';
import ManageFines from './pages/main_staff_page/manage_fines.jsx';
import AccountDashboard from './pages/account_dashboard/AccountDashboard.jsx';
import StaffDashboard from './pages/staff_dashboard/StaffDashboard.jsx';
import Reports from './pages/reports/Reports.jsx';
import Navbar from './pages/navbar/navbar.jsx';
import Footer from './pages/footer/footer.jsx';
import Staff_page from './pages/staff_dashboard/StaffDashboard.jsx';
import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [loading, setLoading] = useState(true); // Start loading
  const [isStaff, setIsStaff] = useState(false); 
  const [isLoggedIn, setIsLoggedIn] = useState(false); 

  useEffect(() => {
    // Read localStorage to set initial state
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');

    if (token) {
      setIsLoggedIn(true);
      setIsStaff(role === 'Staff');
    }
    
    // CRITICAL: Set loading to false ONLY after state is set
    setLoading(false); 
  }, []); 

  // Block rendering until state is initialized
  if (loading) {
    return (
        <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'Inter' }}>
            Loading content...
        </div>
    ); 
  }
  return (
    <BrowserRouter>
      <Navbar
        isStaff={isStaff}
        setIsStaff={setIsStaff}
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
      />

      <Routes>
        {/* USERS */}
        <Route path="/" element={<HomePage />} />
        <Route
          path="/login"
          element={
            isLoggedIn
              ? <Navigate to="/" replace /> // Redirect to home if already signed in
              : <Login setIsStaff={setIsStaff} setIsLoggedIn={setIsLoggedIn} />
          }
        />
        <Route
          path="/register"
          element={
            isLoggedIn
              ? <Navigate to="/" replace /> // Redirect to home if already signed in
              : <Register setIsStaff={setIsStaff} setIsLoggedIn={setIsLoggedIn} />
          }
        />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/search" element={<SearchResults isStaff={isStaff} />} />
        <Route path="/item/:itemId" element={<ItemDetails isStaff={isStaff} />} />
        <Route path="/account" element={ <AccountDashboard
          isLoggedIn={isLoggedIn}
          setIsLoggedIn={setIsLoggedIn}
          isStaff={isStaff}
          setIsStaff={setIsStaff}
        />
  } />

        {/* STAFF */}
        <Route path="/user" element={<UserProfile />} />
        <Route path="/manage-users" element={<ManageUsers />} />
        <Route path="/user/:userId" element={<UserProfile />} />
        <Route path="/manage-borrows" element={<ManageBorrows />} />
        <Route path="/manage-holds" element={<ManageHolds />} />
        <Route path="/manage-fines" element={<ManageFines />} />
        <Route path="/staff_page" element={<Staff_page />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
