import './manage_borrows.css'
import bookThumbnail from '../../assets/book_thumbnail.jpeg'
import mediaThumbnail from '../../assets/media_thumbnail.jpg'
import deviceThumbnail from '../../assets/device_thumbnail.jpeg'
import sampleData from '../../assets/sample_data.json'

import { useState } from 'react'
import { FaPlus } from 'react-icons/fa'

function ManageBorrows() {
    const borrows = sampleData.borrows;
    const multipleBorrows = [...borrows, ...borrows, ...borrows];

    const filter = sampleData.user_filters.find(filter => filter.category === "Borrows");

    const [showAddBorrowSheet, setShowAddBorrowSheet] = useState(false);
    const [newBorrow, setNewBorrow] = useState({
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewBorrow(prev => ({
            ...prev,
            [name]: value
        }));
    }

    const handleAddBorrowSubmit = (e) => {
        e.preventDefault();
        // Implement submission logic here
        // For now, just close the sheet and reset form
        setShowAddBorrowSheet(false);
        setNewBorrow({
            user_email: '',
            item_id: ''
        });
    }

    return (
        <div>
        <div className="page-container">
            <div className='search-result-page-container'>
                <div className="search-result-header">
                    <h1>Manage Borrows</h1>
                    <div className="search-result-search-bar-container">
                        <button
                            className="action-circle-button primary-button"
                            onClick={() => setShowAddBorrowSheet(true)}
                        >
                            <FaPlus />
                        </button>
                        <input type="text" placeholder="Search borrows..." className="search-result-search-bar" />
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
                        {multipleBorrows.map((borrow) => {
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
                                                <p><strong>User:</strong> <a href={`/user`} className="result-link">{borrow.user.user_first_name} {borrow.user.user_last_name}</a></p>
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
                    </div>
                </div>
            </div>
        </div>
        {showAddBorrowSheet && (
        <div className="sheet-overlay" onClick={() => setShowAddBorrowSheet(false)}>
            <div className="sheet-container" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Borrow</h2>
            <form onSubmit={handleAddBorrowSubmit}>
                <label>
                User Email:
                <input
                    type="email"
                    name="user_email"
                    className="edit-input"
                    value={newBorrow.user_email}
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
                    value={newBorrow.item_id}
                    onChange={handleInputChange}
                    required
                />
                </label>
                <div className="sheet-actions">
                <button type="submit" className="action-button primary-button">Add Borrow</button>
                <button
                    type="button"
                    className="action-button secondary-button"
                    onClick={() => setShowAddBorrowSheet(false)}
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

export default ManageBorrows