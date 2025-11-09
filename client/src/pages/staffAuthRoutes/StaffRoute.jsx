import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const StaffRoute = ({ children }) => {
  // 1. Check local storage for authentication and role
  const token = localStorage.getItem('authToken');
  const userRole = localStorage.getItem('userRole');

  // Define valid staff roles (must match your backend logic)
  const isStaff = userRole === 'Staff';

  // 2. Check 1: Must be authenticated
  if (!token) {
    // If no token, redirect to login page
    // console.log("StaffRoute: No token found, redirecting to login.");
    return <Navigate to="/login" replace />;
  }

  // 3. Check 2: Must be a staff member
  if (!isStaff) {
    // If token exists but role is wrong (e.g., 'Patron'), redirect to access denied or account page
    // console.log("StaffRoute: Invalid role, redirecting to /access-denied.");
    return <Navigate to="/access-denied" replace />; // You should create this component
  }

  // 4. If checks pass, render the children (the Staff Dashboard)
  // console.log("StaffRoute: Access granted.");
  return children ? children : <Outlet />;
};

export default StaffRoute;