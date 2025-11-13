import './user_profile.css';
import React, { useState, useEffect } from 'react'; // --- ADDED useEffect ---
import { useParams, Link, useNavigate } from 'react-router-dom'; // --- ADD useNavigate ---
import { IoCheckmark, IoTrash, IoTimeOutline, IoHourglassOutline, IoWalletOutline, IoReturnUpBackOutline } from "react-icons/io5"; // --- ADDED History Icons ---
import { MdEdit } from "react-icons/md";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; 

const decodeToken = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
};

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

    // State for history lists ---
    const [borrowHistory, setBorrowHistory] = useState([]);
    const [holdHistory, setHoldHistory] = useState([]);
    const [fineHistory, setFineHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [historyError, setHistoryError] = useState('');

    const [loggedInUserRole, setLoggedInUserRole] = useState(null); 
    const [loggedInUserStaffRole, setLoggedInUserStaffRole] = useState(null); 
    const [loggedInUserId, setLoggedInUserId] = useState(null);
    const isSelf = String(userId) === String(loggedInUserId);



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
                setEditedUser({
                    ...data,
                    staffRole: data.staff_role || 'Clerk' 
                });
                setLoading(false);
            })
            .catch(err => {
                console.error("Fetch User Profile Error:", err);
                setError(err.message);
                setLoading(false);
            });
    };

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            const decoded = decodeToken(token);
            if (decoded) {
                if (decoded.id) {
                    setLoggedInUserId(decoded.id);
                }
                if (decoded.role) {
                    setLoggedInUserRole(decoded.role);
                }
                if (decoded.staffRole) {
                    setLoggedInUserStaffRole(decoded.staffRole);
                }
            }
        }
        
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
        if (isSelf) { 
            alert("You cannot edit your own details from Manage Users. Please go to account dashboard.");
            return; // Stop the function immediately
        }
        if (isEditing) {
            handleSaveChanges(); // Call save function when toggling off
        } else {
             // Reset edit state to current user data when starting edit
            setEditedUser({ 
                ...user,
                staffRole: user.staff_role || 'Clerk'
            });
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
                body: JSON.stringify({ 
                    firstName: editedUser.firstName,
                    lastName: editedUser.lastName,
                    email: editedUser.email,
                    role: editedUser.role, // e.g., "Staff"
                    staffRole: editedUser.staffRole // e.g., "Clerk"
                })
            });
            if (!response.ok) {
                 const errData = await response.json();
                 throw new Error(errData.error || `Failed to save changes (Status: ${response.status})`);
            }
            // Success
            fetchUserProfile(); // <-- ADD THIS LINE
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


    const handleDeleteUserClick = () => {
        if (isSelf) {
            // Use setSaveError for consistent error display
            setSaveError("You cannot deactivate your own profile. Please contact an administrator.");
            return;
        }
        
        // If not self, clear any previous error and proceed with the actual logic
        setSaveError('');
        handleDeleteUser();
    };

    // Replace your existing handleDeleteUser function
    const handleDeleteUser = async () => {
        // Change the confirm message to reflect "deactivation"
        if (window.confirm(`Are you sure you want to DEACTIVATE user ${user.firstName} ${user.lastName}? This can be undone.`)) {

            setIsSaving(true); 
            setSaveError('');

            const token = localStorage.getItem('authToken');
            if (!token) {
                setSaveError('Authentication required to deactivate.');
                setIsSaving(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, { 
                    method: 'DELETE', 
                    headers: { 
                        'Authorization': `Bearer ${token}`
                    } 
                });
                if (!response.ok) {
                    const errData = await response.json(); 
                    throw new Error(errData.error || 'Failed to deactivate user');
                }

                // --- CRITICAL CHANGE ---
                // DO NOT navigate away. Instead, refresh the user's data.
                fetchUserProfile(); 
                // alert('User deactivated successfully.'); // Optional: show a small toast/message

            } catch (err) {
                setSaveError(err.message);
            } finally {
                // Re-enable buttons even on success, as we are staying on the page
                setIsSaving(false); 
            }
        }
    };

    // Add this new function inside your UserProfile component
    const handleActivateUser = async () => {
        if (window.confirm(`Are you sure you want to ACTIVATE user ${user.firstName} ${user.lastName}?`)) {

            setIsSaving(true); // Reuse isSaving to disable buttons
            setSaveError('');

            const token = localStorage.getItem('authToken');
            if (!token) {
                setSaveError('Authentication required to activate.');
                setIsSaving(false);
                return;
            }

            try {
                // Calls your NEW backend endpoint
                const response = await fetch(`${API_BASE_URL}/api/users/${userId}/activate`, { 
                    method: 'PUT', 
                    headers: { 
                        'Authorization': `Bearer ${token}`
                    } 
                });
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || 'Failed to activate user');
                }

                // Success: Refresh the profile to show the "Active" status
                fetchUserProfile();

            } catch (err) {
                setSaveError(err.message);
            } finally {
                setIsSaving(false);
            }
        }
    };

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

    const isOriginalRoleStaff = user.role === 'Staff' || user.role === 'Admin';

    const isAssistantLibrarian = loggedInUserStaffRole === 'Assistant Librarian';
    const shouldHideStaffRoleEdit = isAssistantLibrarian && isOriginalRoleStaff;

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

                        {/* --- ADD THIS BADGE --- */}
                        {/* Show badge if deactivated and NOT in edit mode */}
                        {!isEditing && user.account_status === 'DEACTIVATED' && (
                            <span className="status-badge status-deactivated">Deactivated</span>
                        )}

                        {/* --- MODIFY THIS BUTTON --- */}
                        {/* Disable Edit button if user is deactivated */}
                        <button 
                            className="action-circle-button primary-button" 
                            onClick={handleEditToggle} 
                            disabled={isSaving || user.account_status === 'DEACTIVATED'}
                            title={user.account_status === 'DEACTIVATED' ? 'Activate user to edit' : 'Edit User'}
                        >
                            {isEditing ? (isSaving ? '...' : <IoCheckmark />) : <MdEdit />}
                        </button>
                        
                        {/* --- MODIFY THIS SECTION --- */}
                        {/* Show delete/activate only when NOT editing */}
                        {!isEditing && (
                            // Check the user's status (assuming 'ACTIVE' is the default)
                            (user.account_status === 'DEACTIVATED') ? (
                                // User IS deactivated, show ACTIVATE button
                                <button 
                                    className="action-circle-button green-button" 
                                    onClick={handleActivateUser} 
                                    disabled={isSaving}
                                    title="Activate User"
                                >
                                    <IoReturnUpBackOutline />
                                </button>
                            ) : (
                                // User is ACTIVE, show DEACTIVATE (trash) button
                                <button 
                                    className="action-circle-button red-button" 
                                    onClick={handleDeleteUser} 
                                    disabled={isSaving}
                                    title="Deactivate User"
                                >
                                    <IoTrash />
                                </button>
                            )
                        )}
                        
                    </div>
                     {/* Display Save Error */}
                     {saveError && <p style={{ color: 'red', marginTop: '5px' }}>{saveError}</p>}


                    <div className="result-description">
                        <div className="result-details">
                        {isEditing ? (
                            <>
                            <p> <strong>Email:</strong> <input type="email" name="email" value={editedUser.email} onChange={handleInputChange} className="edit-input" required/> </p>
                            {/* CASE 1: User is NOT staff */}
                            {!isOriginalRoleStaff ? (
                                <p> <strong>Role:</strong>
                                    <select name="role" value={editedUser.role} onChange={handleInputChange} className="edit-input" required>
                                        {/* Only show non-staff roles */}
                                        <option value="Patron">Patron</option>
                                        <option value="Student">Student</option>
                                        <option value="Faculty">Faculty</option>
                                    </select>
                                </p>
                            ) : (
                                
                            /* CASE 2: User IS staff */
                            <>
                                {shouldHideStaffRoleEdit ? (
                                // 🛑 RENDER NOTHING or a Note if restricted
                                null
                            ) : (
                                <>
                                    {/* This is the regular Role input (which is disabled by default for staff) */}
                                    <p> <strong>Role:</strong>
                                        <input 
                                            type="text" 
                                            value={editedUser.role} 
                                            className="edit-input" 
                                            disabled 
                                            style={{ backgroundColor: '#eee', cursor: 'not-allowed' }} 
                                        />
                                    </p>
                                    
                                    {/* This is the editable Staff Role input */}
                                    <p> 
                                        <strong>Staff Role:</strong>
                                        <select 
                                            name="staffRole" 
                                            value={editedUser.staffRole} 
                                            onChange={handleInputChange} 
                                            className="edit-input" 
                                            required
                                        >
                                            <option value="Clerk">Clerk</option>
                                            <option value="Assistant Librarian">Assistant Librarian</option>
                                            {/* Add Admin option if necessary */}
                                        </select>
                                    </p>
                                </>
                            )}
                            </>
                            )}
                            </>
                        ) : (
                            <>
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
                            <div className="search-result-buttons">
                                <button className={`action-button ${activeSection === 'borrows' ? 'primary-button' : 'secondary-button'}`} onClick={() => setActiveSection('borrows')}> Borrows </button>
                                <button className={`action-button ${activeSection === 'holds' ? 'primary-button' : 'secondary-button'}`} onClick={() => setActiveSection('holds')}> Holds </button>
                                <button className={`action-button ${activeSection === 'fines' ? 'primary-button' : 'secondary-button'}`} onClick={() => setActiveSection('fines')}> Fines </button>
                            </div>
                        </div>
                        <div className="search-results-contents">
                          <div className="search-results-list" style={{width: '100%'}}>{renderHistorySection()}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UserProfile;