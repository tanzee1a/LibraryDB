import './manage_users.css';
import React, { useState, useEffect } from 'react';
import { FaPlus } from "react-icons/fa";
import { Link, useSearchParams } from 'react-router-dom';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; 

function ManageUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isLibrarian, setIsLibrarian] = useState(false);
    const [isAssistantLibrarian, setIsAssistantLibrarian] = useState(false);

    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [localSearchTerm, setLocalSearchTerm] = useState(query);

    const [sort, setSort] = useState(searchParams.get('sort') || '');

    // --- Add User Sheet state/handlers ---
    const [showAddUserSheet, setShowAddUserSheet] = useState(false);
    const initialUserState = {
        firstName: '', // Changed from first_name
        lastName: '',  // Changed from last_name
        email: '',
        role: 'Patron', // Matches USER.role enum
        staffRole: 'Clerk',
        temporaryPassword: '', // Added password field
        user_id: '' // Added User ID field
    };
    const [newUser, setNewUser] = useState(initialUserState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    // --- End Keep ---

    // --- Currency Formatter (keep as is) ---
    const currencyFormatter = new Intl.NumberFormat('en-US', { /* ... */ });

    // This is now just a static definition of what filters are available.
    // We could make this dynamic later by fetching from USER_ROLE table.
    const userFilterOptions = [
        {
            category: 'Role',
            param: 'role', // URL parameter
            options: ['Patron', 'Student', 'Faculty', 'Staff']
        }
    ];

    // --- Fetch Users Logic ---
    const fetchUsers = () => {
        setLoading(true);
        setError('');

        const token = localStorage.getItem('authToken'); 
        const authHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        };
        
        if (!token) {
            setError('Authentication token missing. Please log in.');
            setLoading(false); // Corrected from setLoadingStats
            return;
        }

        // Get the full query string from state
        const queryString = searchParams.toString();

        fetch(`${API_BASE_URL}/api/users?${queryString}`, { // <-- Pass the query string
            method: 'GET',
            headers: authHeaders
        })
            .then(res => {
                if (res.status === 401 || res.status === 403) {
                    return Promise.reject('Unauthorized access or insufficient privileges.');
                }
                return res.ok ? res.json() : Promise.reject('Failed to fetch users');
            })
            .then(data => { setUsers(data || []); setLoading(false); })
            .catch(err => { 
                console.error("Fetch Users Error:", err); 
                setError(`Could not load users. (${err instanceof Error ? err.message : err})`); 
                setLoading(false); 
            });
    };

    useEffect(() => {
        const token = localStorage.getItem('authToken'); 
        if (!token) return;

        // Fetch User List (will use searchParams)
        fetchUsers();

        // ... (Fetch Logged-in Staff Profile logic remains the same) ...
        fetch(`${API_BASE_URL}/api/staff/my-profile`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch staff profile'))
            .then(data => {
                const roleName = data.role_name;
                if (roleName === 'Librarian') {
                    setIsLibrarian(true);
                } else if (roleName === 'Assistant Librarian') {
                    setIsAssistantLibrarian(true);
                }
                setNewUser(prev => ({
                    ...prev,
                    role: (roleName === 'Librarian' || roleName === 'Assistant Librarian') ? 'Patron' : 'Clerk'
                }));
            })
            .catch(err => {
                console.error("Fetch Staff Profile Error:", err);
            });
    // --- Re-run this effect if the search parameters in the URL change ---
    }, [searchParams]);
    // --- End Fetch ---

    // --- handleInputChange (remains the same) ---
    // Inside ManageUsers component
    function handleInputChange(e) {
        const { name, value } = e.target;
        // Log to check if it fires
        console.log(`Input changed: Name=${name}, Value=${value}`); 
        setNewUser(prev => ({ 
            ...prev, // Keep the rest of the state
            [name]: value // Update the specific field that changed
        }));
    }

    // --- MODIFIED: handleAddUserSubmit ---
    async function handleAddUserSubmit(e) { // Make async
        e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    // --- 1. Get the Auth Token ---
    const token = localStorage.getItem('authToken');
    if (!token) {
        setSubmitError('Authentication token missing. Cannot add user.');
        setIsSubmitting(false);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // --- 2. Add the Authorization Header ---
                'Authorization': `Bearer ${token}` 
            },
            // Send the state directly (ensure names match backend expectations)
            body: JSON.stringify(newUser) 
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error ${response.status}`);
        }

        // Success
        console.log("New User Added:", await response.json());
        setShowAddUserSheet(false);
        setNewUser(initialUserState); // Reset form
        fetchUsers(); // Refresh user list

    } catch (err) {
        console.error("Add User Error:", err);
        setSubmitError(`Failed to add user: ${err.message}`);
    } finally {
        setIsSubmitting(false);
    }
}
    // --- END MODIFIED ---

    // --- HELPER FUNCTION: Get available roles based on staff permissions ---
    const getAvailableUserRoles = () => {
        let roles = ['Patron', 'Student', 'Faculty']; // Base roles available to Assistant Librarian
        
        if (isLibrarian) {
            // Librarian can add anyone, including staff (Clerk/Assistant Librarian)
            roles.push('Staff');
        } 
        // If not Librarian, they can't add 'Staff' accounts

        return roles;
    }

    const handleSearch = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const term = localSearchTerm.trim();
            
            // Get current filters to preserve them
            const currentParams = Object.fromEntries(searchParams.entries());

            if (term) {
                // Set the 'q' param, keeping other filters
                setSearchParams({ ...currentParams, q: term });
            } else {
                // If search is cleared, remove 'q' but keep other filters
                delete currentParams.q;
                setSearchParams(currentParams);
            }
        }
    };

    const handleFilterChange = (param, option) => {
        const currentValues = (searchParams.get(param) || '')
            .split(',')
            .filter(Boolean); // filter(Boolean) removes empty strings

        let newValues;
        if (currentValues.includes(option)) {
            // Remove option if already selected
            newValues = currentValues.filter(v => v !== option);
        } else {
            // Add option if not selected
            newValues = [...currentValues, option];
        }

        // Push new filter state back to URL, which triggers useEffect to refetch
        const next = new URLSearchParams(searchParams);
        if (newValues.length) {
            next.set(param, newValues.join(','));
        } else {
            next.delete(param);
        }
        setSearchParams(next);
    };

    const handleSortChange = (event) => {
        const sortType = event.target.value;
        setSort(sortType); // Update local state for the dropdown

        // Get current params to preserve filters/search
        const currentParams = Object.fromEntries(searchParams.entries());
        const next = new URLSearchParams(currentParams);

        if (sortType) {
            next.set('sort', sortType);
        } else {
            next.delete('sort'); // Fallback, though dropdown has no empty option
        }
        
        // Set the new URL, which triggers useEffect to refetch
        setSearchParams(next);
    };

    return (
        <div>
        <div className="page-container">
            <div className='search-result-page-container'>
                <div className="search-result-header">
                    <h1>Manage Users</h1>
                    <div className="search-result-search-bar-container">
                        <button
                            className="action-circle-button primary-button"
                            onClick={() => setShowAddUserSheet(true)}
                            >
                            <FaPlus />
                        </button>
                        <input 
                            type="text" 
                            placeholder="Search users (by name or email)..." 
                            className="search-result-search-bar"
                            value={localSearchTerm}
                            onChange={(e) => setLocalSearchTerm(e.target.value)}
                            onKeyDown={handleSearch}
                        />
                    </div>
                </div>
                <div className="search-results-contents">
                    <div className="filter-section">
                        <div className="sort-select-wrapper">
                            Sort by:
                            <select
                                className="sort-select"
                                value={sort} // Use state to control the value
                                onChange={handleSortChange} // Use the new handler
                            >
                                <option value="" disabled></option>
                                <option value="Fname_asc">First Name (A–Z)</option>
                                <option value="Lname_asc">Last Name (A–Z)</option>
                                <option value="Fname_desc">First Name (Z–A)</option>
                                <option value="Lname_desc">Last Name (Z–A)</option>
                            </select>
                        </div>
                        {userFilterOptions.map((filterGroup) => (
                            <div key={filterGroup.param} className="filter-category">
                                <h3>{filterGroup.category}</h3>
                                <hr className='thin-divider divider--tight' />
                                <ul>
                                    {filterGroup.options.map((option) => {
                                        // Check if this filter option is in the URL searchParams
                                        const isChecked = (searchParams.get(filterGroup.param) || '')
                                                            .split(',')
                                                            .includes(option);
                                        return (
                                            <li key={option}>
                                                <label>
                                                    <input 
                                                        type="checkbox" 
                                                        value={option}
                                                        // Wire up the checkbox
                                                        checked={isChecked}
                                                        onChange={() => handleFilterChange(filterGroup.param, option)}
                                                    /> {option}
                                                </label>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}
                    </div>
                    {/* --- MODIFIED User List --- */}
                    <div className="search-results-list" style={{width: '100%'}}> {/* Make list full width if no filter */}
                        {loading && <p>Loading users...</p>}
                        {error && <p style={{ color: 'red' }}>{error}</p>}
                        {!loading && !error && users.length === 0 && <p>No users found.</p>}

                        {/* Map over fetched 'users' state */}
                        {!loading && !error && users.map((user) => (
                            // Use user_id for the key
                            <div key={user.user_id} className="search-result-item"> 
                                <div className="result-info">
                                    <div className='result-text-info'>
                                        {/* Link to a user profile page (optional) */}
                                        <h2 className='result-title'>
                                           {/* --- MODIFIED: Use Link with dynamic user_id --- */}
                                            <Link to={`/user/${user.user_id}`} className="result-link">
                                                {user.firstName} {user.lastName}
                                            </Link>
                                            {/* --- END MODIFIED --- */}
                                        </h2>
                                        <div className="result-description">
                                            <div className="result-details">
                                                <p><strong>Email:</strong> {user.email || 'N/A'}</p>
                                                <p><strong>Role:</strong> {user.role} {user.staff_role ? `(${user.staff_role})` : ''}</p>
                                            </div>
                                            {/* --- TODO: Fetch these counts separately if needed --- */}
                                            {/* <div className="result-details">
                                                <p><strong>Current Borrows:</strong> {user.current_borrows || 0}</p>
                                                <p><strong>Active Holds:</strong> {user.active_holds || 0}</p>
                                                <p><strong>Outstanding Fines:</strong> {currencyFormatter.format(user.outstanding_fines || 0)}</p>
                                            </div> */}
                                        </div>
                                    </div>
                                    {/* Optional Actions Column */}
                                    {/* <div className="result-actions">
                                        <button className="btn secondary">Edit</button> 
                                    </div> */}
                                </div>
                                <hr className="thin-divider" />
                            </div>
                        ))}
                    </div>
                    {/* --- END MODIFIED User List --- */}
                </div>
            </div>
        </div>
        {/* --- MODIFIED Add User Sheet Form --- */}
        {showAddUserSheet && (isLibrarian || isAssistantLibrarian) && (
            <div className="sheet-overlay" onClick={() => !isSubmitting && setShowAddUserSheet(false)}>
                <div className="sheet-container" onClick={(e) => e.stopPropagation()}>
                <h2>Add New User</h2>
                {submitError && <p style={{color: 'red'}}>{submitError}</p>}
                <form onSubmit={handleAddUserSubmit}>
                    <label> First Name: <input type="text" className="edit-input" name="firstName" value={newUser.firstName} onChange={handleInputChange} required /> </label>
                    <label> Last Name: <input type="text" className="edit-input" name="lastName" value={newUser.lastName} onChange={handleInputChange} required /> </label>
                    <label> Email: <input type="email" className="edit-input" name="email" value={newUser.email} onChange={handleInputChange} required /> </label>
                    <label> Temporary Password: <input type="password" className="edit-input" name="temporaryPassword" value={newUser.temporaryPassword} onChange={handleInputChange} required /> </label>
                    
                    {/* 💡 MODIFIED: Role Selection Dropdown */}
                    <label> Role:
                        <select name="role" className="edit-input" value={newUser.role} onChange={handleInputChange} required>
                            {getAvailableUserRoles().map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </label>
                    
                    {/* --- STAFF Role Dropdown: Only shown if 'Staff' is selected, and only available to Librarians --- */}
                    {newUser.role === 'Staff' && isLibrarian && (
                        <label> Staff Role:
                            <select name="staffRole" className="edit-input" value={newUser.staffRole} onChange={handleInputChange} required>
                                {/* These values MUST match the 'role_name' in your STAFF_ROLES table */}
                                <option value="Clerk">Clerk</option>
                                <option value="Assistant Librarian">Assistant Librarian</option>
                            </select>
                        </label>
                    )}
                    
                    <div className="sheet-actions">
                    <button type="submit" className="action-button primary-button" disabled={isSubmitting}>
                         {isSubmitting ? 'Adding...' : 'Add User'}
                    </button>
                    <button type="button" className="action-button secondary-button" onClick={() => setShowAddUserSheet(false)} disabled={isSubmitting}>
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

export default ManageUsers;