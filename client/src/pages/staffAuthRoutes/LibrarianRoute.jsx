import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const LibrarianRoute = ({ children }) => {
  // 1. Check token and roles from localStorage
  const token = localStorage.getItem('authToken');
  const userRole = localStorage.getItem('userRole');       // Staff / Patron / etc.
  const staffRole = localStorage.getItem('staffRole');     // Librarian / Assistant Librarian / null

  // 2. Must be authenticated
  if (!token) return <Navigate to="/login" replace />;

  // 3. Must be a Staff Librarian
  if (userRole !== 'Staff' || staffRole !== 'Librarian') {
    return <Navigate to="/access-denied" replace />; // Optional: create an AccessDenied page
  }

  // 4. Access granted
  return children ? children : <Outlet />;
};

export default LibrarianRoute;
