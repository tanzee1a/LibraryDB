import './manage_borrows.css'

import { useState, useEffect } from 'react';
import { FaPlus } from 'react-icons/fa'
import { Link } from 'react-router-dom'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; 
function ManageBorrows() {

    const [borrows, setBorrows] = useState([]);
    const [borrowStatus, setBorrowStatus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showAddBorrowSheet, setShowAddBorrowSheet] = useState(false);
    const initialBorrowState = {
        user_email: '',
        item_id: ''
    };
    const [newBorrow, setNewBorrow] = useState(initialBorrowState);
    const [isSubmitting, setIsSubmitting] = useState(false); // Add submitting state
    const [submitError, setSubmitError] = useState('');     // Add error state
    // --- END MODIFIED ---

    const filterOptions = () => {
        return [{
            category: 'Status',
            param: 'status',
            options: borrowStatus.map(status => status.status_name)
        }]
    };

    const fetchBorrowStatus = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/status/borrow`);
            if (!response.ok) throw new Error('Failed to fetch borrow status');
            const data = await response.json();
            setBorrowStatus(data);
        } catch (err) {
            console.error('Error fetching borrow status:', err);
        }
    };

    const handleSortChange = (sortType) => {
        console.log("Sort by:", sortType);
        // Example: apply sorting logic to results
        let sorted = [...borrows];
        if (sortType === "title_asc") sorted.sort((a, b) => a.title.localeCompare(b.title));
        if (sortType === "title_desc") sorted.sort((a, b) => b.title.localeCompare(a.title));
        if (sortType === "newest") sorted.sort((a, b) => (b.release_year || 0) - (a.release_year || 0));
        if (sortType === "oldest") sorted.sort((a, b) => (a.release_year || 0) - (b.release_year || 0));
        setBorrows(sorted);
    };

    const renderBorrowActionButtons = (borrow) => {
        const buttons = [];
        // Use status_name fetched from API
        switch (borrow.status_name) { 
            case 'Loaned Out': // Check includes Overdue implicitly via date
                buttons.push(<button key="return" onClick={() => handleReturn(borrow.borrow_id)} className="action-button primary-button">Mark as Returned</button>);
                buttons.push(<button key="lost" onClick={() => handleMarkLost(borrow.borrow_id)} className="action-button secondary-button">Mark as Lost</button>);
                break;
            // -- Cases based on HOLD table status (Need to fetch Holds separately if managing them here) --
            // case 'Pending': // This status is for BORROW, but action relates to HOLD
            //     buttons.push(<button key="ready" onClick={() => handleReadyForPickup(borrow.hold_id)} className="action-button primary-button">Ready for Pickup</button>);
            //     buttons.push(<button key="cancel" onClick={() => handleCancelRequest(borrow.hold_id)} className="action-button secondary-button">Cancel Request</button>);
            //     break;
             // case 'Ready for Pickup': // This isn't a BORROW_STATUS, maybe a HOLD status?
                // buttons.push(<button key="cancel" onClick={() => handleCancelRequest(borrow.hold_id)} className="action-button secondary-button">Cancel Request</button>);
                // break;
             // -- End Hold logic --
            case 'Lost':
                buttons.push(<button key="found" onClick={() => handleMarkFound(borrow.borrow_id)} className="action-button secondary-button">Mark as Found</button>);
                break;
            case 'Returned':
                // No actions needed
                break;
            default:
                break;
        }
        return buttons;
    }

    const handleReturn = (borrowId) => {

        const token = localStorage.getItem('authToken'); // Or wherever you store your token
        if (!token) {
            alert('You are not logged in.');
            return; 
        }

        fetch(`${API_BASE_URL}/api/return/${borrowId}`, { 
            method: 'POST',
            headers: {'Authorization': `Bearer ${token}`}
        })
            .then(r => { if (!r.ok) throw new Error('Marking return failed'); return r.json(); })
            .then(() => fetchBorrows()) // Refresh list
            .catch(err => alert(`Error: ${err.message}`));
    };

    const handleMarkLost = (borrowId) => {
        const token = localStorage.getItem('authToken'); // Or wherever you store your token
        if (!token) {
            alert('You are not logged in.');
            return; 
        }
        fetch(`${API_BASE_URL}/api/borrows/${borrowId}/lost`, { 
            method: 'POST', headers: {'Authorization': `Bearer ${token}`
            }
        })
            .then(r => { if (!r.ok) throw new Error('Marking lost failed'); return r.json(); })
            .then(() => fetchBorrows()) // Refresh list
            .catch(err => alert(`Error: ${err.message}`));
    };

    // TODO: Add backend logic & API for ReadyForPickup, CancelRequest, MarkAsFound if needed
    const handleReadyForPickup = (holdId /* Need hold ID here */) => { alert('Ready for Pickup - Not implemented'); };
    const handleCancelRequest = (holdId /* Need hold ID here */) => { alert('Cancel Request - Not implemented'); };
    const handleMarkFound = (borrowId) => {
        const token = localStorage.getItem('authToken'); // Or wherever you store your token
        if (!token) {
            alert('You are not logged in.');
            return; 
        }

        fetch(`${API_BASE_URL}/api/borrows/${borrowId}/found`, { // <<< New endpoint
            method: 'POST', 
            headers: {'Authorization': `Bearer ${token}`}
        })
            .then(r => { 
                if (!r.ok) {
                    // Try to get error message from backend
                    return r.json().then(err => {
                        throw new Error(err.message || 'Marking found failed');
                    });
                }
                return r.json(); 
            })
            .then((data) => {
                console.log(data.message); // Log success message
                fetchBorrows(); // Refresh list
            })
            .catch(err => alert(`Error: ${err.message}`));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewBorrow(prev => ({
            ...prev,
            [name]: value
        }));
    }

    const handleAddBorrowSubmit = async (e) => { // Make async
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError('');

        try {
            const response = await fetch(`${API_BASE_URL}/api/borrows/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userEmail: newBorrow.user_email, // Pass user_email
                    itemId: newBorrow.item_id  // Pass item_id
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error ${response.status}`);
            }

            // Success!
            console.log("Borrow Record Added:", await response.json());
            setShowAddBorrowSheet(false);     // Close sheet
            setNewBorrow(initialBorrowState); // Reset form
            fetchBorrows();                  // Refresh the main borrow list

        } catch (err) {
            console.error("Add Borrow Error:", err);
            setSubmitError(`Failed to add borrow: ${err.message}`);
        } finally {
            setIsSubmitting(false); // Re-enable button
        }
    };

    const fetchBorrows = () => {
        setLoading(true);
        setError('');
        
        // 1. Get Token and Check
        const token = localStorage.getItem('authToken'); 
        if (!token) {
            setError('Authentication token missing. Please log in.');
            setLoading(false); 
            return;
        }

        // 2. Execute Fetch with Headers
        fetch(`${API_BASE_URL}/api/borrows`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, // CRITICAL: Authorization header
                'Content-Type': 'application/json'
            }
        }) // Fetch all borrows
            .then(r => {
                // Check for explicit 401/403 errors
                if (r.status === 401 || r.status === 403) {
                    throw new Error('Unauthorized access or insufficient privileges.');
                }
                if (!r.ok) throw new Error('Network response failed'); 
                return r.json(); 
            })
            .then(data => { 
                setBorrows(data || []); 
                setLoading(false); 
            })
            .catch(err => { 
                console.error("Fetch Borrows Error:", err); 
                setError(`Could not load borrows. (${err.message})`); 
                setLoading(false); 
            });
    };

    useEffect(() => {
        fetchBorrows(); // Fetch on initial mount
        fetchBorrowStatus(); // Fetch borrow status options
    }, []);

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
                        <div className="sort-select-wrapper">
                            Sort by:
                            <select
                                className="sort-select"
                                onChange={(e) => handleSortChange(e.target.value)}
                                defaultValue=""
                            >
                                <option value="" disabled></option>
                                <option value="title_asc">Title (A–Z)</option>
                                <option value="title_desc">Title (Z–A)</option>
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                            </select>
                        </div>
                        {filterOptions().map((filterGroup) => (
                            <div key={filterGroup.param} className="filter-category">
                                <h3>{filterGroup.category}</h3>
                                <hr className='thin-divider divider--tight' />
                                <ul>
                                    {filterGroup.options.map((option) => {
                                        return ( // Start returning the list item
                                            <li key={option}>
                                                <label>
                                                    <input 
                                                        type="checkbox" 
                                                        value={option}
                                                    /> {option}
                                                </label>
                                            </li>
                                        ); // End returning list item
                                    })} {/* End options.map */}
                                </ul>
                            </div>
                        ))} {/* End filterOptions.map */}
                    </div>
                    <div className="search-results-list">
                        {loading && <p>Loading borrows...</p>}
                        {error && <p style={{ color: 'red' }}>{error}</p>}
                        {!loading && !error && borrows.length === 0 && <p>No borrow records found.</p>}

                        {!loading && !error && borrows.map((borrow) => {
                            // Use data fetched from API
                            return (
                                <div key={`borrow-${borrow.borrow_id}`} className={`search-result-item ${borrow.category?.toLowerCase() || 'default'}`}>
                                    <div className="result-info">
                                    <div>
                                        <img 
                                            src={borrow.thumbnail_url || '/placeholder-image.png'} 
                                            alt={borrow.item_title} 
                                            className="result-thumbnail" 
                                            onError={(e) => { e.target.onerror = null; e.target.src='/placeholder-image.png'; }}
                                        />
                                    </div>
                                    <div className='result-text-info'>
                                        <div className='result-title-header'>
                                            <h3 className="result-title">Borrow #{borrow.borrow_id}</h3>
                                             {/* Display status_name from API */}
                                            <p className={`result-status status-${borrow.status_name?.replace(/\s+/g, '-').toLowerCase()}`}>{borrow.status_name || 'Unknown'}</p> 
                                        </div>
                                        <div className="result-description">
                                            <div className="result-details">
                                                <p><Link to={`/item/${borrow.item_id}`} className="result-link">{borrow.item_title || 'Unknown Item'}</Link></p>
                                                <p><small><strong>User:</strong> {borrow.firstName} {borrow.lastName}</small></p>
                                                <p><small><strong>Item ID:</strong> {borrow.item_id}</small></p>
                                                <p><small><strong>Borrowed:</strong> {borrow.borrow_date ? new Date(borrow.borrow_date).toLocaleDateString() : '-'}</small></p>
                                                <p><small><strong>Due:</strong> {borrow.due_date ? new Date(borrow.due_date).toLocaleDateString() : '-'}</small></p>
                                                <p><small><strong>Returned:</strong> {borrow.return_date ? new Date(borrow.return_date).toLocaleDateString() : '-'}</small></p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="result-actions">
                                        {renderBorrowActionButtons(borrow)}
                                    </div>
                                </div>
                                <hr className="thin-divider" />
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
        {showAddBorrowSheet && (
            <div className="sheet-overlay" onClick={() => !isSubmitting && setShowAddBorrowSheet(false)}>
                <div className="sheet-container" onClick={(e) => e.stopPropagation()}>
                <h2>Add New Borrow (Direct Checkout)</h2>
                {/* Display submission error */}
                {submitError && <p style={{color: 'red'}}>{submitError}</p>}
                <form onSubmit={handleAddBorrowSubmit}>
                    <label>
                    User Email:
                    <input
                        type="text" // Changed from email
                        name="user_email" // Changed from user_id
                        className="edit-input"
                        value={newBorrow.user_email}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter Patron's User Email (e.g., user@example.com)"
                    />
                    </label>
                    <label>
                    Item ID:
                    <input
                        type="text" // Changed from number, item_id is char(13)
                        name="item_id"
                        className="edit-input"
                        value={newBorrow.item_id}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter Item ID (e.g., 978... or DEV...)"
                    />
                    </label>
                    <div className="sheet-actions">
                    <button type="submit" className="action-button primary-button" disabled={isSubmitting}>
                         {isSubmitting ? 'Processing...' : 'Checkout Item'}
                    </button>
                    <button
                        type="button"
                        className="action-button secondary-button"
                        onClick={() => setShowAddBorrowSheet(false)}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    </div>
                </form>
                </div>
            </div>
            )}
            {/* --- END MODIFIED --- */}
        </div>
    )
}

export default ManageBorrows