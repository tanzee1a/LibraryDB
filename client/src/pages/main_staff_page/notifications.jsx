import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

function Notifications() {
  const [allNotifications, setAllNotifications] = useState([]);

  // Helper to get token (replace with your auth context/storage)
  const getToken = () => localStorage.getItem('token');

  const fetchStaffNotifications = async () => {
    try {
      const token = getToken();
      if (!token) return; // Don't fetch if not logged in

      const res = await fetch(`${API_BASE_URL}/api/staff-notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAllNotifications(data);
      } else {
        console.error("Failed to fetch staff notifications");
      }
    } catch (error) {
      console.error("Error fetching staff notifications:", error);
    }
  };

  useEffect(() => {
    fetchStaffNotifications();
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        // Update state locally
        setAllNotifications(prev =>
          prev.map(notif =>
            notif.notification_id === notificationId
              ? { ...notif, is_read: 1 }
              : notif
          )
        );
      } else {
        console.error("Failed to mark as read");
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const unReadNotifications = allNotifications.filter(n => n.is_read === 0);
  const readNotifications = allNotifications.filter(n => n.is_read === 1);

  return (
    <div>
      <div className="page-container">
        <div className='search-result-page-container'>
          <div className="search-result-header">
            <h1>Notifications</h1>
          </div>
          <div className="search-results-contents">
            <div className="search-results-list" style={{ width: '100%' }}>
              <h2>Unread Notifications</h2>
              {unReadNotifications.length === 0 && <p>No unread notifications.</p>}
              {unReadNotifications.map((notification) => (
                <div key={notification.notification_id} className="search-result-item">
                  <div className="result-info">
                    <div className='result-text-info'>
                      {/* Wrap title in Link if notification.link exists */}
                      {notification.link ? (
                        <Link to={notification.link}>
                          <h3 className='result-title result-title-blue'>{notification.title}</h3>
                        </Link>
                      ) : (
                        <h3 className='result-title result-title-blue'>{notification.title}</h3>
                      )}
                      <div className="result-description">
                        <div className="result-details">
                          <p><strong>Message:</strong> {notification.message}</p>
                          <p><strong>Date:</strong> {new Date(notification.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    <div className="result-actions">
                      <button
                        onClick={() => handleMarkAsRead(notification.notification_id)}
                        className="action-button secondary-button"
                      >
                        Mark As Read
                      </button>
                    </div>
                  </div>
                  <hr className="thin-divider" />
                </div>
              ))}
              
              <h2>Read Notifications</h2>
              {readNotifications.length === 0 && <p>No read notifications.</p>}
              {readNotifications.map((notification) => (
                <div key={notification.notification_id} className="search-result-item">
                  <div className="result-info">
                    <div className='result-text-info'>
                      {/* Wrap title in Link if notification.link exists */}
                      {notification.link ? (
                        <Link to={notification.link}>
                          <h3 className='result-title result-title-blue'>{notification.title}</h3>
                        </Link>
                      ) : (
                        <h3 className='result-title result-title-blue'>{notification.title}</h3>
                      )}
                      <div className="result-description">
                        <div className="result-details">
                          <p><strong>Message:</strong> {notification.message}</p>
                          <p><strong>Date:</strong> {new Date(notification.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="thin-divider" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Notifications;

/*
  const unReadNotifications = [
    {
      id: 1,
      title: "New Loan Request Submitted",
      message: "A new loan request for 'Data Structures and Algorithms' requires approval.",
      date: "2025-11-06",
      isRead: false
    },
    {
      id: 2,
      title: "Hold Expired",
      message: "The hold for 'Design Patterns' has expired and is now available to other patrons.",
      date: "2025-11-05",
      isRead: false
    },
    {
      id: 3,
      title: "Overdue Item Returned",
      message: "A previously overdue item 'Artificial Intelligence: A Modern Approach' was returned.",
      date: "2025-11-04",
      isRead: false
    }
  ]

  const readNotifications = [
    {
      id: 4,
      title: "System Backup Completed",
      message: "The system backup completed successfully on 2025-11-01.",
      date: "2025-11-01",
      isRead: true
    },
    {
      id: 5,
      title: "New Staff Account Created",
      message: "A new staff account for user 'John Doe' has been created.",
      date: "2025-10-30",
      isRead: true
    }
  ]

*/
  