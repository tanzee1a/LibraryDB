import { useState, useEffect } from 'react';
import './AccountDashboard.css';
import { useLocation } from 'react-router-dom';
import Navbar from '../navbar/navbar.jsx';
import ProfileCard from './ProfileCard.jsx';
import Profile from './Profile.jsx';
import Fines from './Fines';
import Loans from './Loans';
import BorrowHistory from './BorrowHistory';
import Wishlist from './Wishlist';
import Holds from './Holds';
import Notifications from './Notifications';
import { IoHomeOutline, IoBookOutline, IoWalletOutline, IoTimeOutline, IoHeartOutline, IoPersonCircleOutline, IoHourglassOutline, IoNotificationsOutline } from 'react-icons/io5';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; 

const SECTIONS = [
  { key: 'overview', label: 'Overview', icon: <IoHomeOutline className="nav-icon" /> },
  { key: 'notifications', label: 'Notifications', icon: <IoNotificationsOutline className="nav-icon" /> },
  { key: 'loans', label: 'Current Loans', icon: <IoBookOutline className="nav-icon" /> },
  { key: 'fines', label: 'Fines', icon: <IoWalletOutline className="nav-icon" /> },
  { key: 'history', label: 'Loan History', icon: <IoTimeOutline className="nav-icon" /> },
  { key: 'holds', label: 'Holds', icon: <IoHourglassOutline className="nav-icon" /> },
  { key: 'wishlist', label: 'Saved for Later', icon: <IoHeartOutline className="nav-icon" /> },
  { key: 'profile', label: 'Profile', icon: <IoPersonCircleOutline className="nav-icon" /> },
];

export default function AccountDashboard({ isLoggedIn, setIsLoggedIn, isStaff, setIsStaff }) {
  
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const sectionFromURL = params.get('section');

    const [active, setActive] = useState(sectionFromURL || 'overview');

    // Optional: sync URL change dynamically
    useEffect(() => {
      if (sectionFromURL && sectionFromURL !== active) {
        setActive(sectionFromURL);
      }
    }, [sectionFromURL]);

  return (
    <div className="dashboard-container">
      <Navbar
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        isStaff={isStaff}
        setIsStaff={setIsStaff}
        onNavigateDashboard={setActive}
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
                  <div className="section-header"><IoHourglassOutline className="icon" /><h3>Holds</h3></div>
                  <Holds />
                  </div>
                <div className="card">
                <div className="section-header"><IoHeartOutline className="icon" /><h3>Saved For Later</h3></div>
                <Wishlist />
                </div>
              </section>
            )}
            {active === 'notifications' && (
              <section className="card">
                <div className="section-header"><IoNotificationsOutline className="icon" /><h2 className="section-title">Notifications</h2></div>
                <Notifications />
              </section>
            )}
            {active === 'loans' && (
              <section className="card">
                <div className="section-header"><IoBookOutline className="icon" /><h2 className="section-title">Current Loans</h2></div>
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
                <div className="section-header"><IoTimeOutline className="icon" /><h2 className="section-title">Loan History</h2></div>
                <BorrowHistory />
              </section>
            )}

            {active === 'holds' && (
              <section className="card">
                <div className="section-header"><IoHourglassOutline className="icon" /><h2 className="section-title">Holds</h2></div>
                <Holds />
              </section>
            )}

            {active === 'wishlist' && (
              <section className="card">
                <div className="section-header"><IoHeartOutline className="icon" /><h2 className="section-title">Saved For Later</h2></div>
                <Wishlist />
              </section>
            )}

            {active === 'profile' && (
              <section className="card">
                <div className="section-header"><IoPersonCircleOutline className="icon" /><h2 className="section-title">Profile</h2></div>
                <Profile/>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}