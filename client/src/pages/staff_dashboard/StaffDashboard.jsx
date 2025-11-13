import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IoBookOutline, IoPeopleOutline, IoSwapHorizontalOutline, IoHourglassOutline, IoWalletOutline, IoDocumentTextOutline, IoPersonCircleOutline, IoNotificationsOutline } from 'react-icons/io5';
import './StaffDashboard.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; 

function StaffDashboard() {
  const [stats, setStats] = useState({ loans: 0, overdue: 0, pendingPickups: 0, outstandingFines: 0 });
  const [profile, setProfile] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let statsError = '';
    let profileError = '';
    setLoadingStats(true);
    setLoadingProfile(true);
    setError('');

    const token = localStorage.getItem('authToken'); 
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    };
    
    if (!token) {
        setError('Authentication token missing. Please log in.');
        setLoadingStats(false);
        setLoadingProfile(false);
        return;
    }

    // Fetch Stats
    fetch(`${API_BASE_URL}/api/staff/dashboard-stats`, { headers: authHeaders }) 
      .then(res => res.ok ? res.json() : Promise.reject('Stats fetch failed (Auth/Server Error)'))
      .then(data => setStats(data))
      .catch(err => {
        console.error("Fetch Stats Error:", err);
        statsError = ' Failed to load stats.';
      })
      .finally(() => {
          setLoadingStats(false);
          if (statsError || profileError) setError((statsError + profileError).trim());
      });

    // Fetch Profile
    fetch(`${API_BASE_URL}/api/staff/my-profile`, { headers: authHeaders })
      .then(res => res.ok ? res.json() : Promise.reject('Profile fetch failed (Auth/Server Error)'))
      .then(data => setProfile(data))
      .catch(err => {
        console.error("Fetch Profile Error:", err);
        profileError = ' Failed to load profile.';
      })
      .finally(() => {
          setLoadingProfile(false);
           if (statsError || profileError) setError((statsError + profileError).trim());
      });

  }, []);

  // Determine if the logged-in user is a Head Librarian
  const isHeadLibrarian = profile && profile.role_name === 'Librarian';
  const isAssistLibrarian = profile && profile.role_name === 'Assistant Librarian';
  const isClerk = profile && profile.role_name === 'Clerk';



  return (
    <div className="page-container staff-dashboard-container">
      {loadingProfile ? (
        <div className="staff-profile-header card loading">Loading profile...</div>
      ) : profile ? (
        <div className="staff-profile-header card">
          <IoPersonCircleOutline className="action-icon" />
          <div>
            <h3>Welcome, {profile.firstName} {profile.lastName}!</h3>
            <small>
              Role: {profile.role_name}
              {' '}•{' '}
              <a 
                href="/staff-profile" 
                className="result-link hover:text-blue-800 hover:underline"
              >
                Change your password here!
              </a>
            </small> 
          </div>
        </div>
      ) : (
         <div className="staff-profile-header card error">Could not load staff profile.</div>
      )}

      <h1>Staff Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <IoSwapHorizontalOutline className="stat-icon loans" />
          <div>
            <div className="stat-value">{loadingStats ? '...' : stats.loans}</div>
            <div className="stat-label">Items Loaned Out</div>
          </div>
        </div>
        <div className="stat-card">
          <IoHourglassOutline className="stat-icon overdue" />
          <div>
             <div className="stat-value">{loadingStats ? '...' : stats.overdue}</div>
            <div className="stat-label">Items Overdue</div>
          </div>
        </div>
        <div className="stat-card">
          <IoHourglassOutline className="stat-icon pending" />
          <div>
            <div className="stat-value">{loadingStats ? '...' : stats.pendingPickups}</div>
            <div className="stat-label">Pending Pickups</div>
          </div>
        </div>
         <div className="stat-card">
          <IoWalletOutline className="stat-icon fines" />
          <div>
             <div className="stat-value">{loadingStats ? '...' : stats.outstandingFines}</div>
            <div className="stat-label">Outstanding Fines</div>
          </div>
        </div>
      </div>
       {error && !loadingStats && !loadingProfile && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}


      <hr className="divider" />

      {/* Navigation Cards Section */}
      <h2>Management Tools</h2>
      <div className="action-grid">
        <Link to="/notifications" className="action-card">
          <IoNotificationsOutline className="action-icon" />
          Notifications
          <small>See recent alerts and updates.</small>
        </Link>
        {(isHeadLibrarian || isAssistLibrarian) &&  (
        <Link to="/search" className="action-card">
          <IoBookOutline className="action-icon" />
          Manage Items
          <small>Add, edit, or remove books, movies, devices.</small>
        </Link>
        )}
        {(isHeadLibrarian || isAssistLibrarian) && (
        <Link to="/manage-users" className="action-card">
          <IoPeopleOutline className="action-icon" />
          Manage Users
          <small>View patron details and manage accounts.</small>
        </Link>
        )}
         <Link to="/manage-borrows" className="action-card">
          <IoSwapHorizontalOutline className="action-icon" />
          Manage Borrows
          <small>View current loans, process returns, mark lost.</small>
        </Link>
         <Link to="/manage-holds" className="action-card"> 
          <IoHourglassOutline className="action-icon" />
          Manage Holds & Requests
          <small>Process pending pickups and view waitlists.</small>
        </Link>
        {(isHeadLibrarian || isAssistLibrarian) && (
        <Link to="/manage-fines" className="action-card"> 
          <IoWalletOutline className="action-icon" />
          Manage Fines
          <small>View and resolve outstanding fines.</small>
        </Link>
        )}
        {(isHeadLibrarian || isAssistLibrarian) && (
          <Link to="/reports" className="action-card"> 
            <IoDocumentTextOutline className="action-icon" />
            Generate Reports
            <small>View library usage statistics and data.</small>
          </Link>
        )}
      </div>
    </div>
  );
}

export default StaffDashboard;