import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from './pages/home_page/homepage.jsx';
import Login from './pages/authentication_page/login.jsx';
import Pricing from './pages/authentication_page/pricing.jsx';
import Register from './pages/authentication_page/register.jsx';
import ItemDetails from './pages/catalog_page/item_details.jsx';
import SearchResults from './pages/catalog_page/search_results.jsx';
import UserProfile from './pages/main_staff_page/user_profile.jsx';
import ManageUsers from './pages/main_staff_page/manage_users.jsx';
import ManageBorrows from './pages/main_staff_page/manage_borrows.jsx';
import ManageHolds from './pages/main_staff_page/manage_holds.jsx';
import ManageFines from './pages/main_staff_page/manage_fines.jsx';
import Notifications from './pages/main_staff_page/notifications.jsx';
import AccountDashboard from './pages/account_dashboard/AccountDashboard.jsx';
import StaffDashboard from './pages/staff_dashboard/StaffDashboard.jsx';
import Reports from './pages/reports/Reports.jsx';
import Navbar from './pages/navbar/navbar.jsx';
import Footer from './pages/footer/footer.jsx';
import Staff_page from './pages/staff_dashboard/StaffDashboard.jsx';
import StaffRoute from './pages/staffAuthRoutes/StaffRoute.jsx'; // 👈 Import the guard
import LibrarianRoute from "./pages/staffAuthRoutes/librarianRoute.jsx";
import AssistLibRoute from "./pages/staffAuthRoutes/AssistLibRoute.jsx";
import ClerkRoute from "./pages/staffAuthRoutes/ClerkRoute.jsx";
import StaffProfile from './pages/staff_dashboard/StaffProfile.jsx'; // 👈 NEW IMPORT: Staff's own profile
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
        <Route
          path="/pricing"
          element={
            isLoggedIn
              ? <Navigate to="/" replace /> // Redirect to home if already signed in
              : <Pricing setIsStaff={setIsStaff} setIsLoggedIn={setIsLoggedIn} />
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
            path="/staff-profile" 
            element={
              <StaffRoute> 
                <StaffProfile /> 
              </StaffRoute>
            } 
          />

  <Route 
          path="/staff_page" 
          element={
            <ClerkRoute>
              <Staff_page />
            </ClerkRoute>
          } 
        />
        
        <Route 
          path="/user" 
          element={
            <AssistLibRoute>
              <UserProfile />
            </AssistLibRoute>
          } 
        />
        
        {/* Route with parameter, needs to be protected */}
        <Route 
          path="/user/:userId" 
          element={
            <AssistLibRoute>
              <UserProfile />
            </AssistLibRoute>
          } 
        />
        
        <Route 
          path="/manage-users" 
          element={
            <AssistLibRoute>
              <ManageUsers />
            </AssistLibRoute>
          } 
        />
        
        <Route 
          path="/manage-borrows" 
          element={
            <ClerkRoute>
              <ManageBorrows />
            </ClerkRoute>
          } 
        />
        
        <Route 
          path="/manage-holds" 
          element={
            <ClerkRoute>
              <ManageHolds />
            </ClerkRoute>
          } 
        />
        
        <Route 
          path="/manage-fines" 
          element={
            <AssistLibRoute>
              <ManageFines />
            </AssistLibRoute>
          } 
        />
        
        <Route 
          path="/reports" 
          element={
            <LibrarianRoute>
              <Reports />
            </LibrarianRoute>
          } 
        />
        
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
