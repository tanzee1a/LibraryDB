import './user_profile.css'
import bookThumbnail from '../../assets/book_thumbnail.jpeg'
import mediaThumbnail from '../../assets/media_thumbnail.jpg'
import deviceThumbnail from '../../assets/device_thumbnail.jpeg'
import sampleData from '../../assets/sample_data.json'
import { IoCheckmark, IoTrash } from "react-icons/io5"
import { MdEdit } from "react-icons/md"
import { useState } from 'react'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; 
function UserProfile() {
    const user = sampleData.users[0];
    const [isEditing, setIsEditing] = useState(false)
    const [editedUser, setEditedUser] = useState({ ...user })
    const [activeSection, setActiveSection] = useState('borrows')

    const currencyFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    });

    function handleEditToggle() {
        if (isEditing) {
            console.log("Saving user data:", editedUser);
            // send the updated user data to the server from the variable `editedUser`
        }
        setIsEditing(!isEditing);
    }
    function handleInputChange(e) {
        const { name, value } = e.target;
        setEditedUser(prev => ({ ...prev, [name]: value }));
    }

    const getThumbnail = (item) => {
        switch(item.item_category) {
            case "BOOK":
                return bookThumbnail;
            case "MEDIA":
                return mediaThumbnail;
            case "DEVICE":
                return deviceThumbnail;
            default:
                return null;
        }
    }

    const renderBorrowActionButtons = (borrow) => {
        const buttons = [];
        switch (borrow.status_id) {
            case 'Overdue':
                buttons.push(<button key="return" className="action-button primary-button">Mark as Returned</button>);
                buttons.push(<button key="lost" className="action-button secondary-button">Mark as Lost</button>);
                break;
            case 'Loaned Out':
                buttons.push(<button key="return" className="action-button primary-button">Mark as Returned</button>);
                buttons.push(<button key="lost" className="action-button secondary-button">Mark as Lost</button>);
                break;
            case 'Pending':
                buttons.push(<button key="ready" className="action-button primary-button">Ready for Pickup</button>);
                buttons.push(<button key="cancel" className="action-button secondary-button">Cancel Request</button>);
                break;
            case 'Ready for Pickup':
                buttons.push(<button key="cancel" className="action-button secondary-button">Cancel Request</button>);
                break;
            case 'Lost':
                buttons.push(<button key="found" className="action-button secondary-button">Mark as Found</button>);
                break;
            case 'Returned':
                // No action buttons for returned items
                break;
            default:
                break;
        }
        return buttons;
    }

    const renderHoldActionButtons = (hold) => {
        const buttons = [];
        switch (hold.status_id) {
            case 'Active':
                buttons.push(<button key="return" className="action-button primary-button">Convert to Borrow</button>);
                buttons.push(<button key="cancel" className="action-button secondary-button">Cancel</button>);
                break;
            case 'Fulfilled':
                buttons.push(<a href="#" className="simple-link">View Borrow</a>);
                break;
            case 'Returned':
                // No action buttons for returned holds
                break;
            default:
                break;
        }
        return buttons;
    }

    const renderFineActionButtons = (fine) => {
        const buttons = [];
        switch (fine.status_id) {
            case 'Awaiting Payment':
                buttons.push(<button key="pay" className="action-button primary-button">Mark as Paid</button>);
                buttons.push(<button key="cancel" className="action-button secondary-button">Cancel Fine</button>);
                break;
            case 'Paid':
                buttons.push(<button key="refund" className="action-button secondary-button">Refund</button>);
                break;
            case "Canceled":
                break;
            default:
                break;
        }
        return buttons;
    }

    function renderHistorySection() {
      switch (activeSection) {
        case 'borrows':
            return (
            <>
                <h2>Borrow History</h2>
                {sampleData.borrows.map((borrow) => {
                    const item = borrow.item;
                    return (
                        <div key={`borrow-${borrow.borrow_id}`} className={`search-result-item ${item.item_category.toLowerCase()}`}>
                            <div className="result-info">
                            <div>
                                <img src={getThumbnail(item)} alt={item.title} className="result-thumbnail" />
                            </div>
                            <div className='result-text-info'>
                                <div className='result-title-header'>
                                    <h3 className="result-title">Borrow #{borrow.borrow_id}</h3>
                                    <p className="result-title">{borrow.status_id}</p>
                                </div>
                                <div className="result-description">
                                    <div className="result-details">
                                        <p><a href={`/item/${item.item_id}`} className="result-link">{item.title}</a></p>
                                        <p><strong>Item ID:</strong> {item.item_id}</p>
                                        <p><strong>Borrow Date:</strong> {borrow.borrow_date || '-'}</p>
                                        <p><strong>Return Date:</strong> {borrow.return_date || '-'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="result-actions">
                                {renderBorrowActionButtons(borrow)}
                            </div>
                        </div>
                        <hr className="divider" />
                        </div>
                    )
                })}
            </>
            );

        case 'holds':
            return (
            <>
                <h2>Hold History</h2>
                {sampleData.holds.map((hold) => {
                    const item = hold.item;
                    return (
                        <div key={`hold-${hold.hold_id}`} className={`search-result-item`}>
                            <div className="result-info">
                            <div>
                                <img src={getThumbnail(item)} alt={item.title} className="result-thumbnail" />
                            </div>
                            <div className='result-text-info'>
                                <div className='result-title-header'>
                                    <h3 className="result-title">Hold #{hold.hold_id}</h3>
                                    <p className="result-title">{hold.status_id}</p>
                                </div>
                                <div className="result-description">
                                    <div className="result-details">
                                        <p><a href={`/item/${item.item_id}`} className="result-link">{item.title}</a></p>
                                        <p><strong>Item ID:</strong> {item.item_id}</p>
                                        <p><strong>Requested Date:</strong> {hold.requested_date}</p>
                                        <p><strong>Request Completed Date:</strong> {hold.request_completed_date || '-'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="result-actions">
                                {renderHoldActionButtons(hold)}
                            </div>
                        </div>
                        <hr className="divider" />
                        </div>
                    )
                })}
            </>
            );

        case 'fines':
          return (
            <>
                <h2>Fine History</h2>
                {sampleData.fines.map((fine) => {
                    return (
                        <div key={`fine-${fine.fine_id}`} className={`search-result-item`}>
                            <div className="result-info">
                            <div className='result-text-info'>
                                <div className='result-title-header'>
                                    <h3 className="result-title">Fine #{fine.fine_id}</h3>
                                    <p className="result-title">{fine.status_id}</p>
                                </div>
                                <div className="result-description">
                                    <div className="result-details">
                                        <p><a href={`/borrow/${fine.borrow_id}`} className="result-link">Borrow #{fine.borrow_id}</a></p>
                                        <p><strong>Date Issued:</strong> {fine.date_issued}</p>
                                        <p><strong>Date Paid:</strong> {fine.date_paid || '-'}</p>
                                        <p><strong>Amount:</strong> {currencyFormatter.format(fine.amount)}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="result-actions">
                                {renderFineActionButtons(fine)}
                            </div>
                        </div>
                        <hr className="divider" />
                        </div>
                    )
                })}
            </>
          );

        default:
          return null;
      }
    }


    return (
        <div>
            <div className="page-container">
                <div className="user-details-container">
                    <div className="details-section">
                    <div className="user-header-section">
                        {isEditing ? (
                        <div>
                            <input
                                type="text"
                                name="first_name"
                                value={editedUser.first_name}
                                onChange={handleInputChange}
                                className="edit-input"
                            />
                            <input
                                type="text"
                                name="last_name"
                                value={editedUser.last_name}
                                onChange={handleInputChange}
                                className="edit-input"
                            />
                        </div>
                        ) : (
                        <h1 className="item-title">{user.first_name} {user.last_name}</h1>
                        )}

                        <button className="action-circle-button primary-button" onClick={handleEditToggle}>
                        {isEditing ? <IoCheckmark /> : <MdEdit />}
                        </button>
                        {!isEditing && (
                            <button className="action-circle-button red-button">
                                <IoTrash />
                            </button>
                        )}
                    </div>

                    <div className="result-description">
                        <div className="result-details">
                        {isEditing ? (
                            <>
                            <p>
                                <strong>Email:</strong>
                                <input
                                type="email"
                                name="email"
                                value={editedUser.email}
                                onChange={handleInputChange}
                                className="edit-input"
                                />
                            </p>
                            <p>
                                <strong>Role:</strong>
                                <input
                                type="text"
                                name="role"
                                value={editedUser.role}
                                onChange={handleInputChange}
                                className="edit-input"
                                />
                            </p>
                            </>
                        ) : (
                            <>
                            <p><strong>Email:</strong> {user.email}</p>
                            <p><strong>Role:</strong> {user.role}</p>
                            </>
                        )}
                        </div>

                        <div className="result-details">
                        <p><strong>Current Borrows:</strong> {user.current_borrows}</p>
                        <p><strong>Active Holds:</strong> {user.active_holds}</p>
                        <p><strong>Outstanding Fines:</strong> {currencyFormatter.format(user.outstanding_fines)}</p>
                        </div>
                    </div>
                    </div>
                    <hr className="divider" />
                    <div className="user-history-section">
                        <div className="search-result-header">
                            <div className="search-result-search-bar-container">
                                <input type="text" placeholder="Search user history..." className="search-result-search-bar" />
                            </div>
                            <div className="search-result-buttons">
                                <button
                                    className={`action-button ${
                                    activeSection === 'borrows' ? 'primary-button' : 'secondary-button'
                                    }`}
                                    onClick={() => setActiveSection('borrows')}
                                >
                                    Borrows
                                </button>
                                <button
                                    className={`action-button ${
                                    activeSection === 'holds' ? 'primary-button' : 'secondary-button'
                                    }`}
                                    onClick={() => setActiveSection('holds')}
                                >
                                    Holds
                                </button>
                                <button
                                    className={`action-button ${
                                    activeSection === 'fines' ? 'primary-button' : 'secondary-button'
                                    }`}
                                    onClick={() => setActiveSection('fines')}
                                >
                                    Fines
                                </button>
                            </div>
                        </div>
                        <div className="search-results-contents">
                          <div className="filter-section">
                            {sampleData.user_filters.map((filter) => (
                              <div key={filter.category} className="filter-category">
                                <h3>{filter.category}</h3>
                                <hr className="divider divider--tight" />
                                <ul>
                                  {filter.topics.map((topic) => (
                                    <li key={topic.name}>
                                      <strong>{topic.name}</strong>
                                      <ul>
                                        {topic.options.map((option) => (
                                          <li key={option}>
                                            <label>
                                              <input type="checkbox" /> {option}
                                            </label>
                                          </li>
                                        ))}
                                      </ul>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                          <div className="search-results-list">{renderHistorySection()}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UserProfile