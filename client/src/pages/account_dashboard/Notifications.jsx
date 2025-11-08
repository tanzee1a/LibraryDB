import { IoNotificationsOutline } from 'react-icons/io5';

function Notifications() {

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

  const handleMarkAsRead = (notificationId) => {
        // Implement the logic to mark the notification as read
        console.log(`Marking notification ${notificationId} as read`);
    }

  return (
        <div className="dashboard-section">
            <h3>Unread Notifications</h3>
            {unReadNotifications.length === 0 ? (
            <p>You have no unread notifications!</p>
            ) : (
            <ul className="list">
                {unReadNotifications.map(notif => (
                    <li key={notif.id} className="list-item">
                        <div className="thumb-icon" aria-hidden="true"><IoNotificationsOutline /></div>
                        <div>
                            <div className="item-title">{notif.title}</div>
                            <div className="item-sub">{notif.message}</div>
                            <div className="item-sub">Date: {new Date(notif.date).toLocaleDateString()}</div>
                        </div>
                        <div>
                        <button 
                            onClick={() => handleMarkAsRead(notif.id)} 
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
                    <li key={notif.id} className="list-item">
                        <div className="thumb-icon" aria-hidden="true"><IoNotificationsOutline /></div>
                        <div>
                            <div className="item-title">{notif.title}</div>
                            <div className="item-sub">{notif.message}</div>
                            <div className="item-sub">Date: {new Date(notif.date).toLocaleDateString()}</div>
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

export default Notifications