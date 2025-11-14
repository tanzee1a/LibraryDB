import { useState, useEffect } from 'react';
import { IoNotificationsOutline } from 'react-icons/io5';
import { Link } from 'react-router-dom';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

function Notifications({ setUnreadCount = () => {} }) {
  const [allNotifications, setAllNotifications] = useState([]);

  const getToken = () => localStorage.getItem('authToken');

  const fetchNotifications = async () => {
    try {
      const token = getToken();
      if (!token) return; 

      const res = await fetch(`${API_BASE_URL}/api/my-notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAllNotifications(data);
        const count = data.filter(n => n.is_read === 0).length;
        setUnreadCount(count);
      } else {
        console.error("Failed to fetch notifications");
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
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
        // Update state locally to move from unread to read
        setAllNotifications(prev =>
          prev.map(notif =>
            notif.notification_id === notificationId
              ? { ...notif, is_read: 1 }
              : notif
          )
        );
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
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
    <div className="dashboard-section">
      <h3>Unread Notifications</h3>
      {unReadNotifications.length === 0 ? (
        <p>You have no unread notifications!</p>
      ) : (
        <ul className="list">
          {unReadNotifications.map(notif => (
            <li key={notif.notification_id} className="list-item">
              <div className="thumb-icon" aria-hidden="true"><IoNotificationsOutline /></div>
              <div>
                {notif.link ? (
                  <Link 
                    to={notif.link} 
                    className="result-link"
                    // Add this onClick handler
                    onClick={() => handleMarkAsRead(notif.notification_id)}
                  >
                    <div className="item-title">{notif.title}</div>
                  </Link>
                ) : (
                  <div className="item-title">{notif.title}</div>
                )}
                <div className="item-sub">{notif.message}</div>
                <div className="item-sub">Date: {new Date(notif.created_at).toLocaleDateString()}</div>
              </div>
              <div>
                <button
                  onClick={() => handleMarkAsRead(notif.notification_id)}
                  className="btn primary"
                >
                  Mark as Read
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {readNotifications.length > 0 && (
        <>
          <h4 style={{ marginTop: '20px' }}>Read Notifications</h4>
          <ul className="list">
            {readNotifications.map(notif => (
              <li key={notif.notification_id} className="list-item">
                <div className="thumb-icon" aria-hidden="true"><IoNotificationsOutline /></div>
                <div>
                  {notif.link ? (
                    <Link to={notif.link} className="result-link">
                      <div className="item-title">{notif.title}</div>
                    </Link>
                  ) : (
                    <div className="item-title">{notif.title}</div>
                  )}
                  <div className="item-sub">{notif.message}</div>
                  <div className="item-sub">Date: {new Date(notif.created_at).toLocaleDateString()}</div>
                </div>
                <div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

export default Notifications;

