import React from 'react';
import './AccountDashboard.css';
import Navbar from '../navbar/navbar.jsx';
import UserProfile from './UserProfile';
import Fines from './Fines';
import Loans from './Loans';
import BorrowHistory from './BorrowHistory';
import Wishlist from './Wishlist';

// basic structure for component
const AccountDashboard = () => {
  return (
  <>
      <div className="dashboard-container">
        {/* 2. Create the main layout container */}
        <div className="dashboard-layout">
          
          {/* Left Column for the four sections */}
          <div className="dashboard-left">
            <Fines />
            <Loans />
            <BorrowHistory />
            <Wishlist />
          </div>

          {/* Right Column for the profile */}
          <div className="dashboard-right">
            <UserProfile />
          </div>

        </div>
      </div>
    </>
  );
};

export default AccountDashboard;