import React, { useState } from 'react';
import './AccountDashboard.css';
import Navbar from '../navbar/navbar.jsx';
import ProfileCard from './UserProfile';
import Fines from './Fines';
import Loans from './Loans';
import BorrowHistory from './BorrowHistory';
import Wishlist from './Wishlist';
import { IoHomeOutline, IoBookOutline, IoWalletOutline, IoTimeOutline, IoHeartOutline, IoPersonCircleOutline } from 'react-icons/io5';

const SECTIONS = [
  { key: 'overview', label: 'Overview', icon: <IoHomeOutline className="nav-icon" /> },
  { key: 'loans', label: 'Loans', icon: <IoBookOutline className="nav-icon" /> },
  { key: 'fines', label: 'Fines', icon: <IoWalletOutline className="nav-icon" /> },
  { key: 'history', label: 'Borrow History', icon: <IoTimeOutline className="nav-icon" /> },
  { key: 'wishlist', label: 'Wishlist', icon: <IoHeartOutline className="nav-icon" /> },
  { key: 'profile', label: 'Profile', icon: <IoPersonCircleOutline className="nav-icon" /> },
];

export default function AccountDashboard({ isLoggedIn, setIsLoggedIn, isStaff, setIsStaff }) {
  const [active, setActive] = useState('overview');

  return (
    <div className="dashboard-container">
      <Navbar
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        isStaff={isStaff}
        setIsStaff={setIsStaff}
      />

      <div className="dashboard-inner">
        <div className="dashboard-layout">
          {/* Sidebar */}
          <aside className="sidebar">
            <h4>My Account</h4>
            <ul className="nav-list">
              {SECTIONS.map(s => (
                <li key={s.key}>
                  <button
                    className={`nav-btn ${active === s.key ? 'active' : ''}`}
                    onClick={() => setActive(s.key)}
                  >
                    {s.icon}
                    <span>{s.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {/* Content */}
          <main className="content">
            {active === 'overview' && (
              <section>
                <div className="card">
                  <div className="section-header"><IoHomeOutline className="icon" /><h2 className="section-title">Overview</h2></div>
                  <div className="grid-2">
                    <div className="card">
                      <div className="section-header"><IoBookOutline className="icon" /><h3>Current Loans</h3></div>
                      <Loans />
                    </div>
                    <div className="card">
                      <div className="section-header"><IoPersonCircleOutline className="icon" /><h3>Your Profile</h3></div>
                      <ProfileCard />
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div className="section-header"><IoWalletOutline className="icon" /><h3>Fines</h3></div>
                  <Fines />
                </div>
                <div className="card">
                  <div className="section-header"><IoHeartOutline className="icon" /><h3>Wishlist</h3></div>
                  <Wishlist />
                </div>
              </section>
            )}

            {active === 'loans' && (
              <section className="card">
                <div className="section-header"><IoBookOutline className="icon" /><h2 className="section-title">Loans</h2></div>
                <Loans />
              </section>
            )}

            {active === 'fines' && (
              <section className="card">
                <div className="section-header"><IoWalletOutline className="icon" /><h2 className="section-title">Fines</h2></div>
                <Fines />
              </section>
            )}

            {active === 'history' && (
              <section className="card">
                <div className="section-header"><IoTimeOutline className="icon" /><h2 className="section-title">Borrow History</h2></div>
                <BorrowHistory />
              </section>
            )}

            {active === 'wishlist' && (
              <section className="card">
                <div className="section-header"><IoHeartOutline className="icon" /><h2 className="section-title">Wishlist</h2></div>
                <Wishlist />
              </section>
            )}

            {active === 'profile' && (
              <section className="card">
                <div className="section-header"><IoPersonCircleOutline className="icon" /><h2 className="section-title">Profile</h2></div>
                <ProfileCard />
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}