import './user_profile.css';
import React, { useState, useEffect } from 'react'; 
import { useParams, Link, useNavigate } from 'react-router-dom'; 
import { IoCheckmark, IoTrash, IoTimeOutline, IoHourglassOutline, IoWalletOutline, IoReturnUpBackOutline } from "react-icons/io5"; 
import { MdEdit } from "react-icons/md";
import { toast } from 'react-toastify'; 


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
    const { userId } = useParams(); 
    const navigate = useNavigate();
    const [user, setUser] = useState(null); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editedUser, setEditedUser] = useState(null); 
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [activeSection, setActiveSection] = useState('borrows'); 

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
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json'
            }
        })
            .then(res => {
                if (res.status === 404) throw new Error('User not found');
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
    }, [userId]); 

    useEffect(() => {
        if (!userId) return; 

        let endpoint = '';
        if (activeSection === 'borrows') endpoint = `/api/users/${userId}/borrows`;
        else if (activeSection === 'holds') endpoint = `/api/users/${userId}/holds`;
        else if (activeSection === 'fines') endpoint = `/api/users/${userId}/fines`;
        else return; 
    
        setLoadingHistory(true);
        setHistoryError('');
    
        const token = localStorage.getItem('authToken');
        if (!token) {
            setHistoryError('Authentication missing for history data.');
            setLoadingHistory(false);
            return;
        }
    
        fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
            .then(res => {
                if (res.status === 401 || res.status === 403) throw new Error('Unauthorized to view history.');
                return res.ok ? res.json() : Promise.reject(`Failed to fetch ${activeSection}`);
            })
            .then(data => {
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
    
    }, [activeSection, userId]); 

    // --- Edit/Save Logic ---
    function handleEditToggle() {
        if (isSelf) { 
            toast.error("You cannot edit your own details from Manage Users. Please go to account dashboard.");
            return; 
        }
        if (isBlockedFromEditingAllStaff) { 
            toast.error("You do not have the necessary permissions to edit another staff member's details.");
            return; 
        }
        if (isEditing) {
            handleSaveChanges();
        } else {
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

        if (isBlockedFromEditingAllStaff) {
            setSaveError("Permission denied: You cannot save changes for another staff member.");
            setIsSaving(false);
            setIsEditing(false); 
            return;
        }
        
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
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ 
                    firstName: editedUser.firstName,
                    lastName: editedUser.lastName,
                    email: editedUser.email,
                    role: editedUser.role, 
                    staffRole: editedUser.staffRole 
                })
            });
            if (!response.ok) {
                 const errData = await response.json();
                 throw new Error(errData.error || `Failed to save changes (Status: ${response.status})`);
            }
            fetchUserProfile();
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
            toast.error("You cannot delete your own profile from Manage Users. Please contact your IT department.");
            return;
        }
        if (isBlockedFromEditingAllStaff) {
            toast.error("You do not have the necessary permissions to deactivate another staff member.");
            return;
        }
        
        // If not self, proceed with the actual delete logic
        handleDeleteUser();
    };

    const handleDeleteUser = async () => {
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

               
                fetchUserProfile(); 

            } catch (err) {
                setSaveError(err.message);
            } finally {
                setIsSaving(false); 
            }
        }
    };

    const handleActivateUser = async () => {
        if (window.confirm(`Are you sure you want to ACTIVATE user ${user.firstName} ${user.lastName}?`)) {

            setIsSaving(true); 
            setSaveError('');

            const token = localStorage.getItem('authToken');
            if (!token) {
                setSaveError('Authentication required to activate.');
                setIsSaving(false);
                return;
            }

            try {
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

                fetchUserProfile();

            } catch (err) {
                setSaveError(err.message);
            } finally {
                setIsSaving(false);
            }
        }
    };
    
    function renderHistorySection() {
    if (loadingHistory) return <p>Loading history...</p>;
    if (historyError) return <p style={{ color: 'red' }}>{historyError}</p>;

    switch (activeSection) {
        case 'borrows':
            if (borrowHistory.length === 0) return <p>No borrow history found.</p>;
            return (
            <>
                <h2>Borrow History</h2>
                {borrowHistory.map((borrow) => (
                    <div key={`borrow-${borrow.borrow_id}`} className="search-result-item"> 
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
                            {!fine.date_paid && !fine.waived_at && (
                                <>
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


    if (loading) return <div className="page-container"><p>Loading user profile...</p></div>;
    if (error) return <div className="page-container"><p style={{ color: 'red' }}>Error: {error}</p></div>;
    if (!user) return <div className="page-container"><p>User not found.</p></div>; // Should not happen if fetch works

    const isOriginalRoleStaff = user?.role === 'Staff' || user.role === 'Admin';
    const isAssistantLibrarian = loggedInUserStaffRole === 'Assistant Librarian';
    const shouldHideStaffRoleEdit = isAssistantLibrarian && isOriginalRoleStaff;
    const isBlockedFromEditingAllStaff = isAssistantLibrarian && isOriginalRoleStaff;


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

                        {!isEditing && user.account_status === 'DEACTIVATED' && (
                            <span className="status-badge status-deactivated">Deactivated</span>
                        )}

                        { user.account_status === 'ACTIVE' && (
                            <button 
                                className="action-circle-button primary-button" 
                                onClick={handleEditToggle} 
                                disabled={isSaving}
                                title={isEditing ? "Save Changes" : "Edit User"}
                            >
                                {isEditing ? (isSaving ? '...' : <IoCheckmark />) : <MdEdit />}
                            </button>
                        )}
                        
                        {!isEditing && (
                            (user.account_status === 'DEACTIVATED') ? (
                                <button 
                                    className="action-circle-button green-button" 
                                    onClick={handleActivateUser} 
                                    disabled={isSaving}
                                    title="Activate User"
                                >
                                    <IoReturnUpBackOutline />
                                </button>
                            ) : (
                                <button 
                                    className="action-circle-button red-button" 
                                    onClick={handleDeleteUserClick} 
                                    disabled={isSaving}
                                    title="Deactivate User"
                                >
                                    <IoTrash />
                                </button>
                            )
                        )}
                        
                    </div>
                     
                     {saveError && <p style={{ color: 'red', marginTop: '5px' }}>{saveError}</p>}


                    <div className="result-description">
                        <div className="result-details">
                        {isEditing ? (
                            <>
                            <p> <strong>Email:</strong> <input type="email" name="email" value={editedUser.email} onChange={handleInputChange} className="edit-input" required/> </p>
                            {!isOriginalRoleStaff ? (
                                <p> <strong>Role:</strong>
                                    <select name="role" value={editedUser.role} onChange={handleInputChange} className="edit-input" required>
                                        <option value="Patron">Patron</option>
                                        <option value="Student">Student</option>
                                        <option value="Faculty">Faculty</option>
                                    </select>
                                </p>
                            ) : (
                            <>
                                {shouldHideStaffRoleEdit ? (
                                null 
                            ) : (
                                <>
                                    <p> <strong>Role:</strong>
                                        <input 
                                            type="text" 
                                            value={editedUser.role} 
                                            className="edit-input" 
                                            disabled 
                                            style={{ backgroundColor: '#eee', cursor: 'not-allowed' }} 
                                        />
                                    </p>
                                    
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
                            <p><strong>Role:</strong> {user.role} {user.staff_role ? `(${user.staff_role})` : ''}</p>
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