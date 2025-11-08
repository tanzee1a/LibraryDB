import { useEffect } from 'react'

// --- ADDED API_BASE_URL ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; 

function Notifications() {


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
  

    useEffect(() => {

    }, []);
    // --- End Fetch ---

    return (
        <div>
        <div className="page-container">
            <div className='search-result-page-container'>
                <div className="search-result-header">
                    <h1>Notifications</h1>
                </div>
                <div className="search-results-contents">
                    {/* --- MODIFIED User List --- */}
                    <div className="search-results-list" style={{width: '100%'}}> {/* Make list full width if no filter */}
                        <h2>Unread Notifications</h2>
                        {/* Map over fetched 'users' state */}
                        {unReadNotifications.map((notification) => (
                            <div key={notification.id} className="search-result-item"> 
                                <div className="result-info">
                                    <div className='result-text-info'>
                                        <h3 className='result-title result-title-blue'>{notification.title}</h3>
                                        <div className="result-description">
                                            <div className="result-details">
                                                <p><strong>Message:</strong> {notification.message}</p>
                                                <p><strong>Date:</strong> {notification.date}</p>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Optional Actions Column */}
                                    <div className="result-actions">
                                        <button className="action-button secondary-button">Mark As Read</button> 
                                    </div>
                                </div>
                                <hr className="thin-divider" />
                            </div>
                        ))}
                        <h2>Read Notifications</h2>
                        {/* Map over fetched 'users' state */}
                        {readNotifications.map((notification) => (
                            <div key={notification.id} className="search-result-item"> 
                                <div className="result-info">
                                    <div className='result-text-info'>
                                        <h3 className='result-title result-title-blue'>{notification.title}</h3>
                                        <div className="result-description">
                                            <div className="result-details">
                                                <p><strong>Message:</strong> {notification.message}</p>
                                                <p><strong>Date:</strong> {notification.date}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <hr className="thin-divider" />
                            </div>
                        ))}
                    </div>
                    {/* --- END MODIFIED User List --- */}
                </div>
            </div>
        </div>
        </div>
    )
}

export default Notifications;