import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const StaffRoute = ({ children }) => {
  // 1. Check local storage for authentication and role
  const token = localStorage.getItem('authToken');
  const userRole = localStorage.getItem('userRole');

  // Define valid staff roles 
  const isStaff = userRole === 'Staff';

  // 2. Check 1: Must be authenticated
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 3. Check 2: Must be a staff member
  if (!isStaff) {
    return <Navigate to="/access-denied" replace />;
  }

  // 4. If checks pass, render the children (the Staff Dashboard)
  return children ? children : <Outlet />;
};

export default StaffRoute;