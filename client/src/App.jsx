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
import StaffRoute from './pages/StaffRoute.jsx'; // 👈 Import the guard
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
              : <Register />
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
  <Route path="/access-denied" element={
            <div style={{ padding: '50px', textAlign: 'center' }}>
                <h2>Access Denied</h2>
                <p>You do not have the required permissions to view this page.</p>
                <p><a href="/">Go to Home</a></p>
            </div>
        } />
  <Route 
          path="/staff_page" 
          element={
            <StaffRoute>
              <Staff_page />
            </StaffRoute>
          } 
        />
        
        <Route 
          path="/user" 
          element={
            <StaffRoute>
              <UserProfile />
            </StaffRoute>
          } 
        />
        
        {/* Route with parameter, needs to be protected */}
        <Route 
          path="/user/:userId" 
          element={
            <StaffRoute>
              <UserProfile />
            </StaffRoute>
          } 
        />
        
        <Route 
          path="/manage-users" 
          element={
            <StaffRoute>
              <ManageUsers />
            </StaffRoute>
          } 
        />
        
        <Route 
          path="/manage-borrows" 
          element={
            <StaffRoute>
              <ManageBorrows />
            </StaffRoute>
          } 
        />
        
        <Route 
          path="/manage-holds" 
          element={
            <StaffRoute>
              <ManageHolds />
            </StaffRoute>
          } 
        />
        
        <Route 
          path="/manage-fines" 
          element={
            <StaffRoute>
              <ManageFines />
            </StaffRoute>
          } 
        />
        
        <Route 
          path="/reports" 
          element={
            <StaffRoute>
              <Reports />
            </StaffRoute>
          } 
        />
        
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
