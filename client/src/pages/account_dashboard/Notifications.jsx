import { IoNotificationsOutline } from 'react-icons/io5';
import { Link } from 'react-router-dom';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

function Notifications() {
  const [allNotifications, setAllNotifications] = useState([]);

  // Helper to get token (replace with your auth context/storage)
  const getToken = () => localStorage.getItem('token');

  const fetchNotifications = async () => {
    try {
      const token = getToken();
      if (!token) return; // Don't fetch if not logged in

      const res = await fetch(`${API_BASE_URL}/api/my-notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAllNotifications(data);
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
                {/* Wrap title in Link if notif.link exists */}
                {notif.link ? (
                  <Link to={notif.link} className="item-title-link">
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
                  {/* Wrap title in Link if notif.link exists */}
                  {notif.link ? (
                    <Link to={notif.link} className="item-title-link">
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


/*
  const unReadNotifications = [
    {
      id: 1,
      title: "Book Available for Pickup",
      message: "Your reserved book 'The Great Gatsby' is now available for pickup.",
      date: "2025-11-05",
      isRead: false
    },
    {
      id: 2,
      title: "Due Date Reminder",
      message: "Reminder: 'Clean Code' is due in 2 days.",
      date: "2025-11-04",
      isRead: false
    },
    {
      id: 3,
      title: "New Fine Added",
      message: "A new fine of $2.50 has been added for late return of 'Introduction to Algorithms'.",
      date: "2025-11-03",
      isRead: false
    }
  ]

  const readNotifications = [
    {
      id: 4,
      title: "System Maintenance",
      message: "The system will be down for maintenance on 2024-10-05.",
      date: "2024-09-30",
      isRead: true
    },
    {
      id: 5,
      title: "Welcome to LibraryDB",
      message: "Thank you for registering with LibraryDB!",
      date: "2024-09-25",
      isRead: true
    }
  ]
  */