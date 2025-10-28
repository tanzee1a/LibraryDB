import React, { useState, useEffect } from 'react'; // --- ADDED hooks ---
import { Link } from 'react-router-dom';
// --- ADDED IoPersonCircleOutline for profile ---
import { IoBookOutline, IoPeopleOutline, IoSwapHorizontalOutline, IoHourglassOutline, IoWalletOutline, IoDocumentTextOutline, IoPersonCircleOutline } from 'react-icons/io5';
import './StaffDashboard.css';

// --- REMOVED hardcoded quickStats ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; 

function StaffDashboard() {
  // --- ADDED State for stats, profile, loading, error ---
  const [stats, setStats] = useState({ loans: 0, overdue: 0, pendingPickups: 0, outstandingFines: 0 });
  const [profile, setProfile] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState('');
  // --- END ADDED ---

  // --- ADDED useEffect to fetch data ---
  useEffect(() => {
    let statsError = '';
    let profileError = '';
    setLoadingStats(true);
    setLoadingProfile(true);
    setError('');

    // Fetch Stats
    fetch('${API_BASE_URL}/api/staff/dashboard-stats') // Or Render URL
      .then(res => res.ok ? res.json() : Promise.reject('Stats fetch failed'))
      .then(data => setStats(data))
      .catch(err => {
        console.error("Fetch Stats Error:", err);
        statsError = ' Failed to load stats.';
      })
      .finally(() => {
          setLoadingStats(false);
          // Update overall error state after both fetches attempt
          if (statsError || profileError) setError((statsError + profileError).trim());
      });

    // Fetch Profile
    fetch('${API_BASE_URL}/api/staff/my-profile') // Or Render URL
      .then(res => res.ok ? res.json() : Promise.reject('Profile fetch failed'))
      .then(data => setProfile(data))
      .catch(err => {
        console.error("Fetch Profile Error:", err);
        profileError = ' Failed to load profile.';
      })
      .finally(() => {
          setLoadingProfile(false);
           // Update overall error state after both fetches attempt
          if (statsError || profileError) setError((statsError + profileError).trim());
      });

  }, []); // Run once on mount
  // --- END ADDED ---


  return (
    <div className="page-container staff-dashboard-container">
      {/* --- ADDED Profile Section --- */}
      {/* Conditionally render based on loading/error/data */}
      {loadingProfile ? (
        <div className="staff-profile-header card loading">Loading profile...</div>
      ) : profile ? (
        <div className="staff-profile-header card"> {/* Simple card style */}
          <IoPersonCircleOutline className="action-icon" /> {/* Re-use icon */}
          <div>
            <h3>Welcome, {profile.firstName} {profile.lastName}!</h3>
            {/* Display role_name from the joined table */}
            <small>Role: {profile.role_name} | ID: {profile.user_id}</small> 
          </div>
        </div>
      ) : (
         <div className="staff-profile-header card error">Could not load staff profile.</div>
      )}
      {/* --- END ADDED --- */}

      <h1>Staff Dashboard</h1>

      {/* Quick Stats Section (Use state) */}
      <div className="stats-grid">
        {/* --- MODIFIED to use 'stats' state and loading --- */}
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
        {/* --- END MODIFIED --- */}
      </div>
       {/* Display overall error only if both fetches failed */}
       {error && !loadingStats && !loadingProfile && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}


      <hr className="divider" />

      {/* Navigation Cards Section (remains the same) */}
      <h2>Management Tools</h2>
      <div className="action-grid">
        {/* --- Links remain the same --- */}
        <Link to="/manage-items" className="action-card">
          <IoBookOutline className="action-icon" />
          Manage Items
          <small>Add, edit, or remove books, movies, devices.</small>
        </Link>
        <Link to="/manage-users" className="action-card">
          <IoPeopleOutline className="action-icon" />
          Manage Users
          <small>View patron details and manage accounts.</small>
        </Link>
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
        <Link to="/manage-fines" className="action-card"> 
          <IoWalletOutline className="action-icon" />
          Manage Fines
          <small>View and resolve outstanding fines.</small>
        </Link>
        <Link to="/reports" className="action-card"> 
          <IoDocumentTextOutline className="action-icon" />
          Generate Reports
          <small>View library usage statistics and data.</small>
        </Link>
      </div>
    </div>
  );
}

export default StaffDashboard;