import './user_profile.css';
// --- REMOVED sampleData & static thumbnails ---
// At the top of user_profile.jsx
import React, { useState, useEffect } from 'react'; // --- ADDED useEffect ---
import { useParams, Link, useNavigate } from 'react-router-dom'; // --- ADD useNavigate ---
import { IoCheckmark, IoTrash, IoTimeOutline, IoHourglassOutline, IoWalletOutline } from "react-icons/io5"; // --- ADDED History Icons ---
import { MdEdit } from "react-icons/md";

// --- ADDED API_BASE_URL ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; 

function UserProfile() {
    // --- State for fetched user, loading, error, editing ---
    const { userId } = useParams(); // Get user ID from URL
    const navigate = useNavigate();
    const [user, setUser] = useState(null); // Full profile from API
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editedUser, setEditedUser] = useState(null); // State for edits
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [activeSection, setActiveSection] = useState('borrows'); // State for history tabs

    // --- ADDED State for history lists ---
    const [borrowHistory, setBorrowHistory] = useState([]);
    const [holdHistory, setHoldHistory] = useState([]);
    const [fineHistory, setFineHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [historyError, setHistoryError] = useState('');
    // --- END ADDED ---

    // --- Currency Formatter ---
    const currencyFormatter = new Intl.NumberFormat('en-US', { /* ... */ });

    // --- Fetch User Profile Data ---
    const fetchUserProfile = () => {
        setLoading(true);
        setError('');
    
        const token = localStorage.getItem('authToken');
        if (!token) {
            setError('Authentication required to view this profile.');
            setLoading(false);
            return;
        }
    
        fetch(`${API_BASE_URL}/api/users/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, // CRITICAL: Add Auth Header
                'Content-Type': 'application/json'
            }
        })
            .then(res => {
                if (res.status === 404) throw new Error('User not found');
                // Check for unauthorized access
                if (res.status === 401 || res.status === 403) throw new Error('Unauthorized to access user data.'); 
                if (!res.ok) throw new Error('Failed to fetch user profile');
                return res.json();
            })
            .then(data => {
                setUser(data);
                setEditedUser(data); // Initialize edit state
                setLoading(false);
            })
            .catch(err => {
                console.error("Fetch User Profile Error:", err);
                setError(err.message);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchUserProfile();
    }, [userId]); // Refetch if userId changes
    // --- End Fetch ---

    // Add this useEffect inside the UserProfile component
    useEffect(() => {
        if (!userId) return; 

        let endpoint = '';
        if (activeSection === 'borrows') endpoint = `/api/users/${userId}/borrows`;
        else if (activeSection === 'holds') endpoint = `/api/users/${userId}/holds`;
        else if (activeSection === 'fines') endpoint = `/api/users/${userId}/fines`;
        else return; 
    
        setLoadingHistory(true);
        setHistoryError('');
        // ... clear previous data ...
    
        // --- Authentication Logic for History Fetch ---
        const token = localStorage.getItem('authToken');
        if (!token) {
            setHistoryError('Authentication missing for history data.');
            setLoadingHistory(false);
            return;
        }
        // --- End Auth Logic ---
    
        fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, // CRITICAL: Add Auth Header
                'Content-Type': 'application/json'
            }
        })
            .then(res => {
                if (res.status === 401 || res.status === 403) throw new Error('Unauthorized to view history.');
                return res.ok ? res.json() : Promise.reject(`Failed to fetch ${activeSection}`);
            })
            .then(data => {
                // ... (rest of your success logic remains the same)
                if (activeSection === 'borrows') setBorrowHistory(data || []);
                if (activeSection === 'holds') setHoldHistory(data || []);
                if (activeSection === 'fines') setFineHistory(data || []);
                setLoadingHistory(false);
            })
            .catch(err => {
                console.error(`Fetch ${activeSection} Error:`, err);
                setHistoryError(`Could not load ${activeSection} history. (${err.message})`);
                setLoadingHistory(false);
            });
    
    }, [activeSection, userId]); // Re-run when tab or user changes

    // --- Edit/Save Logic ---
    function handleEditToggle() {
        if (isEditing) {
            handleSaveChanges(); // Call save function when toggling off
        } else {
             // Reset edit state to current user data when starting edit
            setEditedUser({ ...user }); 
            setIsEditing(true);
        }
    }

    async function handleSaveChanges() {
        setIsSaving(true);
        setSaveError('');
        
        const token = localStorage.getItem('authToken');
        if (!token) {
            setSaveError('Authentication required to save changes.');
            setIsSaving(false);
            return;
        }
    
        try {
            const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // CRITICAL: Add Auth Header
                },
                body: JSON.stringify({ // Send only editable fields
                    firstName: editedUser.firstName,
                    lastName: editedUser.lastName,
                    email: editedUser.email,
                    role: editedUser.role
                })
            });
            if (!response.ok) {
                 const errData = await response.json();
                 throw new Error(errData.error || `Failed to save changes (Status: ${response.status})`);
            }
            // Success
            setUser(editedUser);
            setIsEditing(false);
        } catch (err) {
            console.error("Save User Error:", err);
            setSaveError(err.message);
        } finally {
            setIsSaving(false);
        }
    }
    function handleInputChange(e) {
        const { name, value } = e.target;
        setEditedUser(prev => ({ ...prev, [name]: value }));
    }
    // --- End Edit/Save ---

    // --- End Edit/Save ---

    const handleDeleteUser = async () => {
        if (window.confirm(`Are you sure you want to delete user ${user.firstName} ${user.lastName}? This cannot be undone.`)) {

            setIsSaving(true); // Reuse isSaving to disable buttons
            setSaveError('');

            const token = localStorage.getItem('authToken');
            if (!token) {
                setSaveError('Authentication required to delete.');
                setIsSaving(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, { 
                    method: 'DELETE', 
                    headers: { 
                        'Authorization': `Bearer ${token}` // Add auth header
                    } 
                });
                if (!response.ok) {
                    const errData = await response.json(); // Get error from backend
                    throw new Error(errData.error || 'Failed to delete user');
                }

                alert('User deleted successfully. Redirecting...'); 
                navigate('/manage-users'); // Redirect to user list

            } catch (err) {
                // Display the error from the backend (e.g., "Cannot delete user...")
                setSaveError(err.message);
                setIsSaving(false); // Re-enable buttons on failure
            }
        }
    };
    // --- End Delete ---

    // --- Render History Section ---
    // NOTE: This now uses separate API calls for detailed history.
    // We'll keep the basic structure but add placeholders for fetching.
    // Replace the old renderHistorySection function
    function renderHistorySection() {
    // Show loading/error states for history section
    if (loadingHistory) return <p>Loading history...</p>;
    if (historyError) return <p style={{ color: 'red' }}>{historyError}</p>;

    switch (activeSection) {
        case 'borrows':
            if (borrowHistory.length === 0) return <p>No borrow history found.</p>;
            return (
            <>
                <h2>Borrow History</h2>
                {borrowHistory.map((borrow) => (
                    <div key={`borrow-${borrow.borrow_id}`} className="search-result-item"> {/* Use unique key */}
                        <div className="result-info">
                        <div>
                            <img 
                            src={borrow.thumbnail_url || '/placeholder-image.png'} 
                            alt={borrow.item_title} 
                            className="result-thumbnail" 
                            onError={(e) => { e.target.onerror = null; e.target.src='/placeholder-image.png'; }} // <<< Correct onError handler
                            />
                        </div>
                        <div className='result-text-info'>
                            <div className='result-title-header'>
                                <h3 className="result-title">Borrow #{borrow.borrow_id}</h3>
                                {/* Display actual status */}
                                <p className={`result-status status-${borrow.status_name?.replace(/\s+/g, '-').toLowerCase()}`}>{borrow.status_name}</p>
                            </div>
                            <div className="result-description">
                                <div className="result-details">
                                    <p><Link to={`/item/${borrow.item_id}`} className="result-link">{borrow.item_title}</Link></p>
                                    <p><small><strong>Borrowed:</strong> {new Date(borrow.borrow_date).toLocaleDateString()}</small></p>
                                    <p><small><strong>Due:</strong> {new Date(borrow.due_date).toLocaleDateString()}</small></p>
                                    <p><small><strong>Returned:</strong> {borrow.return_date ? new Date(borrow.return_date).toLocaleDateString() : '-'}</small></p>
                                </div>
                            </div>
                        </div>
                        <div className="result-actions">
                            {/* TODO: Add staff action buttons if needed (Mark Lost/Found?) */}
                            {/* Use renderBorrowActionButtons(borrow) if defined elsewhere and applicable */}
                        </div>
                    </div>
                    <hr className="thin-divider" />
                    </div>
                ))}
            </>
            );

        case 'holds':
            if (holdHistory.length === 0) return <p>No hold history found.</p>;
            return (
            <>
                <h2>Hold History</h2>
                {holdHistory.map((hold) => (
                    <div key={`hold-${hold.hold_id}`} className="search-result-item">
                        <div className="result-info">
                        <div>
                            <img src={hold.thumbnail_url || '/placeholder-image.png'} alt={hold.item_title} className="result-thumbnail" onError={(e) => { e.target.onerror = null; e.target.src='/placeholder-image.png'; }}/>
                        </div>
                        <div className='result-text-info'>
                            <div className='result-title-header'>
                                <h3 className="result-title">Hold #{hold.hold_id}</h3>
                                <p className={`result-status status-${hold.hold_status?.replace(/\s+/g, '-').toLowerCase()}`}>{hold.hold_status}</p>
                            </div>
                            <div className="result-description">
                                <div className="result-details">
                                    <p><Link to={`/item/${hold.item_id}`} className="result-link">{hold.item_title}</Link></p>
                                    <p><small><strong>Requested:</strong> {new Date(hold.created_at).toLocaleString()}</small></p>
                                    <p><small><strong>Expires:</strong> {new Date(hold.expires_at).toLocaleString()}</small></p>
                                    <p><small><strong>Picked Up:</strong> {hold.picked_up_at ? new Date(hold.picked_up_at).toLocaleString() : '-'}</small></p>
                                    <p><small><strong>Canceled:</strong> {hold.canceled_at ? new Date(hold.canceled_at).toLocaleString() : '-'}</small></p>
                                </div>
                            </div>
                        </div>
                        <div className="result-actions">
                            {/* No actions usually needed for past holds */}
                        </div>
                    </div>
                    <hr className="thin-divider" />
                    </div>
                ))}
            </>
            );

        case 'fines':
            if (fineHistory.length === 0) return <p>No fine history found.</p>;
            return (
            <>
                <h2>Fine History</h2>
                {fineHistory.map((fine) => (
                    <div key={`fine-${fine.fine_id}`} className="search-result-item">
                        <div className="result-info">
                        <div className='result-text-info'>
                            <div className='result-title-header'>
                                <h3 className="result-title">Fine #{fine.fine_id} ({fine.fee_type})</h3>
                                {/* Calculate status */}
                                <p className={`result-status ${fine.date_paid ? 'status-paid' : (fine.waived_at ? 'status-waived' : 'status-unpaid')}`}>
                                    {fine.date_paid ? 'Paid' : (fine.waived_at ? 'Waived' : 'Unpaid')}
                                </p>
                            </div>
                            <div className="result-description">
                                <div className="result-details">
                                    <p><small><strong>Borrow ID:</strong> {fine.borrow_id}</small></p>
                                    <p><small><strong>Item:</strong> {fine.item_title}</small></p>
                                    <p><strong>Amount:</strong> {currencyFormatter.format(fine.amount)}</p>
                                    <p><small><strong>Issued:</strong> {new Date(fine.date_issued).toLocaleString()}</small></p>
                                    <p><small><strong>Paid:</strong> {fine.date_paid ? new Date(fine.date_paid).toLocaleString() : '-'}</small></p>
                                    <p><small><strong>Waived:</strong> {fine.waived_at ? new Date(fine.waived_at).toLocaleString() : '-'} {fine.waived_reason ? `(${fine.waived_reason})` : ''}</small></p>
                                    {fine.notes && <p><small><strong>Notes:</strong> {fine.notes}</small></p>}
                                </div>
                            </div>
                        </div>
                        <div className="result-actions">
                            {/* Add Pay/Waive buttons if needed */}
                            {!fine.date_paid && !fine.waived_at && (
                                <>
                                    {/* <button className="btn primary">Mark Paid</button> */}
                                    {/* <button className="btn secondary">Waive</button> */}
                                </>
                            )}
                        </div>
                    </div>
                    <hr className="thin-divider" />
                    </div>
                ))}
            </>
            );
        default: return null;
    }
    }
    // --- End Render History ---


    // --- Loading/Error States ---
    if (loading) return <div className="page-container"><p>Loading user profile...</p></div>;
    if (error) return <div className="page-container"><p style={{ color: 'red' }}>Error: {error}</p></div>;
    if (!user) return <div className="page-container"><p>User not found.</p></div>; // Should not happen if fetch works
    // --- End States ---

    return (
        <div>
            <div className="page-container">
                <div className="user-details-container">
                    <div className="details-section">
                    <div className="user-header-section">
                        {isEditing ? (
                        <div>
                            <input type="text" name="firstName" value={editedUser.firstName} onChange={handleInputChange} className="edit-input" required/>
                            <input type="text" name="lastName" value={editedUser.lastName} onChange={handleInputChange} className="edit-input" required/>
                        </div>
                        ) : (
                        <h1 className="item-title">{user.firstName} {user.lastName}</h1>
                        )}

                        <button className="action-circle-button primary-button" onClick={handleEditToggle} disabled={isSaving}>
                            {isEditing ? (isSaving ? '...' : <IoCheckmark />) : <MdEdit />}
                        </button>
                        {/* Show delete only when NOT editing */}
                        {!isEditing && (
                            <button className="action-circle-button red-button" onClick={handleDeleteUser} disabled={isSaving}>
                                <IoTrash />
                            </button>
                        )}
                        
                    </div>
                     {/* Display Save Error */}
                     {saveError && <p style={{ color: 'red', marginTop: '5px' }}>{saveError}</p>}


                    <div className="result-description">
                        <div className="result-details">
                        {isEditing ? (
                            <>
                            <p> <strong>User ID:</strong> {user.user_id} </p> {/* ID not editable */}
                            <p> <strong>Email:</strong> <input type="email" name="email" value={editedUser.email} onChange={handleInputChange} className="edit-input" required/> </p>
                            <p> <strong>Role:</strong>
                                <select name="role" value={editedUser.role} onChange={handleInputChange} className="edit-input" required>
                                    <option value="Patron">Patron</option>
                                    <option value="Staff">Staff</option>
                                </select>
                                {/* TODO: Add Staff Role selection if role is Staff */}
                             </p>
                            </>
                        ) : (
                            <>
                            <p><strong>User ID:</strong> {user.user_id}</p>
                            <p><strong>Email:</strong> {user.email || 'N/A'}</p>
                            {/* Display staff role if applicable */}
                            <p><strong>Role:</strong> {user.role} {user.staff_role ? `(${user.staff_role})` : ''}</p>
                            </>
                        )}
                        </div>

                        {/* Display Counts from API */}
                        <div className="result-details">
                            <p><strong>Current Borrows:</strong> {user.current_borrows}</p>
                            <p><strong>Active Holds:</strong> {user.active_holds}</p>
                            <p><strong>Outstanding Fines:</strong> {currencyFormatter.format(user.outstanding_fines)}</p>
                        </div>
                    </div>
                    </div>
                    <hr className="thin-divider" />
                    <div className="user-history-section">
                        <div className="search-result-header">
                            {/* TODO: Add history search */}
                            <div className="search-result-search-bar-container">
                                <input type="text" placeholder="Search user history..." className="search-result-search-bar" />
                            </div>
                            {/* Tab Buttons */}
                            <div className="search-result-buttons">
                                <button className={`action-button ${activeSection === 'borrows' ? 'primary-button' : 'secondary-button'}`} onClick={() => setActiveSection('borrows')}> Borrows </button>
                                <button className={`action-button ${activeSection === 'holds' ? 'primary-button' : 'secondary-button'}`} onClick={() => setActiveSection('holds')}> Holds </button>
                                <button className={`action-button ${activeSection === 'fines' ? 'primary-button' : 'secondary-button'}`} onClick={() => setActiveSection('fines')}> Fines </button>
                            </div>
                        </div>
                        <div className="search-results-contents">
                          {/* --- REMOVED Static Filters --- */}
                          {/* <div className="filter-section"> ... </div> */}
                          {/* Make list full width */}
                          <div className="search-results-list" style={{width: '100%'}}>{renderHistorySection()}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UserProfile;