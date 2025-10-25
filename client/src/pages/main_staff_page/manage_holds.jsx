import './manage_holds.css'
import bookThumbnail from '../../assets/book_thumbnail.jpeg'
import mediaThumbnail from '../../assets/media_thumbnail.jpg'
import deviceThumbnail from '../../assets/device_thumbnail.jpeg'
import sampleData from '../../assets/sample_data.json'

import { useState } from 'react'
import { FaPlus } from 'react-icons/fa'

function ManageHolds() {
    const holds = sampleData.holds;
    const multipleHolds = [...holds, ...holds, ...holds];

    const filter = sampleData.user_filters.find(filter => filter.category === "Holds");

    const [showAddHoldSheet, setShowAddHoldSheet] = useState(false);
    const [newHold, setNewHold] = useState({
        user_email: '',
        item_id: ''
    });

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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewHold(prev => ({
            ...prev,
            [name]: value
        }));
    }

    const handleAddHoldSubmit = (e) => {
        e.preventDefault();
        // Implement submission logic here
        // For now, just close the sheet and reset form
        setShowAddHoldSheet(false);
        setNewHold({
            user_email: '',
            item_id: ''
        });
    }

    return (
        <div>
        <div className="page-container">
            <div className='search-result-page-container'>
                <div className="search-result-header">
                    <h1>Manage Holds</h1>
                    <div className="search-result-search-bar-container">
                        <button
                            className="action-circle-button primary-button"
                            onClick={() => setShowAddHoldSheet(true)}
                        >
                            <FaPlus />
                        </button>
                        <input type="text" placeholder="Search holds..." className="search-result-search-bar" />
                    </div>
                </div>
                <div className="search-results-contents">
                    <div className="filter-section">
                    {
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
                    }
                    </div>
                    <div className="search-results-list">
                        {multipleHolds.map((hold) => {
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
                                                {/* `/user-profile/${hold.user.user_id}` */}
                                                {/* `/item-details/${item.item_id}` */}
                                                <p><strong>User:</strong> <a href={`/user`} className="result-link">{hold.user.user_first_name} {hold.user.user_last_name}</a></p>
                                                <p><strong>Item:</strong> <a href={`/item-details`} className="result-link">{item.title}</a></p>
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
                    </div>
                </div>
            </div>
        </div>
        {showAddHoldSheet && (
        <div className="sheet-overlay" onClick={() => setShowAddHoldSheet(false)}>
            <div className="sheet-container" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Hold</h2>
            <form onSubmit={handleAddHoldSubmit}>
                <label>
                User Email:
                <input
                    type="email"
                    name="user_email"
                    className="edit-input"
                    value={newHold.user_email}
                    onChange={handleInputChange}
                    required
                />
                </label>
                <label>
                Item ID:
                <input
                    type="number"
                    name="item_id"
                    className="edit-input"
                    value={newHold.item_id}
                    onChange={handleInputChange}
                    required
                />
                </label>
                <div className="sheet-actions">
                <button type="submit" className="action-button primary-button">Add Hold</button>
                <button
                    type="button"
                    className="action-button secondary-button"
                    onClick={() => setShowAddHoldSheet(false)}
                >
                    Cancel
                </button>
                </div>
            </form>
            </div>
        </div>
        )}
        </div>
    )
}

export default ManageHolds