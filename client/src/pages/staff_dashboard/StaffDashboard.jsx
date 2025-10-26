import React from 'react';
import { Link } from 'react-router-dom';
import { IoBookOutline, IoPeopleOutline, IoSwapHorizontalOutline, IoHourglassOutline, IoWalletOutline, IoDocumentTextOutline, IoStatsChartOutline } from 'react-icons/io5';
import './StaffDashboard.css'; // Create this CSS file

// Placeholder for fetching quick stats (implement later)
const quickStats = {
    loans: 125,
    overdue: 15,
    pendingPickups: 8,
    outstandingFines: 3,
};

function StaffDashboard() {
  return (
    <div className="page-container staff-dashboard-container">
      <h1>Staff Dashboard</h1>

      {/* Quick Stats Section */}
      <div className="stats-grid">
        <div className="stat-card">
          <IoSwapHorizontalOutline className="stat-icon loans" />
          <div>
            <div className="stat-value">{quickStats.loans}</div>
            <div className="stat-label">Items Loaned Out</div>
          </div>
        </div>
        <div className="stat-card">
          <IoHourglassOutline className="stat-icon overdue" />
          <div>
            <div className="stat-value">{quickStats.overdue}</div>
            <div className="stat-label">Items Overdue</div>
          </div>
        </div>
        <div className="stat-card">
          <IoHourglassOutline className="stat-icon pending" />
          <div>
            <div className="stat-value">{quickStats.pendingPickups}</div>
            <div className="stat-label">Pending Pickups</div>
          </div>
        </div>
         <div className="stat-card">
          <IoWalletOutline className="stat-icon fines" />
          <div>
            <div className="stat-value">{quickStats.outstandingFines}</div>
            <div className="stat-label">Outstanding Fines</div>
          </div>
        </div>
      </div>

      <hr className="divider" />

      {/* Navigation Cards Section */}
      <h2>Management Tools</h2>
      <div className="action-grid">
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
         <Link to="/manage-holds" className="action-card"> {/* New Route */}
          <IoHourglassOutline className="action-icon" />
          Manage Holds & Requests
          <small>Process pending pickups and view waitlists.</small>
        </Link>
        <Link to="/manage-fines" className="action-card"> {/* New Route */}
          <IoWalletOutline className="action-icon" />
          Manage Fines
          <small>View and resolve outstanding fines.</small>
        </Link>
        <Link to="/reports" className="action-card"> {/* New Route */}
          <IoDocumentTextOutline className="action-icon" />
          Generate Reports
          <small>View library usage statistics and data.</small>
        </Link>
      </div>
    </div>
  );
}

export default StaffDashboard;