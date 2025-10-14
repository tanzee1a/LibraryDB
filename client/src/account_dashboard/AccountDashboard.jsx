import React from 'react';
import './AccountDashboard.css';
import UserProfile from './UserProfile';

// basic structure for component
const AccountDashboard = () => {
  return (
    <div className="dashboard-container">
      <h1>My Account Dashboard</h1>
      <UserProfile />
    </div>
  );
};

export default AccountDashboard;