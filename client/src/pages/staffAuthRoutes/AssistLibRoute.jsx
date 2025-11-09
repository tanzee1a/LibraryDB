import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';


const AssistLibRoute = ({ children }) => {
  const token = localStorage.getItem('authToken');
  const userRole = localStorage.getItem('userRole');
  const staffRole = localStorage.getItem('staffRole'); // CRITICAL: Read the specific staff role

  // Define valid staff roles for this route (Assistant Librarian and above)
  const validStaffRoles = ['Assistant Librarian', 'Librarian'];
  
  // Check 1: Must be authenticated
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Check 2: Must have primary role 'Staff' AND secondary role must be in the valid list
  const isStaff = userRole === 'Staff';
  const hasAccess = isStaff && validStaffRoles.includes(staffRole);

  // DEBUG: Check the role being read from local storage
  if (token && userRole) {
      // This debug log is helpful for verification
      console.log(`AssistantLibrarianRoute: User Role: '${userRole}', Staff Role: '${staffRole}'. Access granted: ${hasAccess}`);
  }

  if (!hasAccess) {
    return <Navigate to="/access-denied" replace />;
  }

  return children ? children : <Outlet />;
};

export default AssistLibRoute;
