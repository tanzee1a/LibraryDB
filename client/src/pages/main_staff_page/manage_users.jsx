import './manage_users.css';
// --- REMOVED sampleData ---
import React, { useState, useEffect } from 'react'; // --- ADDED useEffect ---
import { FaPlus } from "react-icons/fa";
import { Link } from 'react-router-dom'; // --- ADDED Link ---

// --- ADDED API_BASE_URL ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; 

function ManageUsers() {
    // --- ADDED State for users, loading, error ---
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    // --- END ADDED ---

    // --- Keep Add User Sheet state/handlers ---
    const [showAddUserSheet, setShowAddUserSheet] = useState(false);
    const initialUserState = {
        firstName: '', // Changed from first_name
        lastName: '',  // Changed from last_name
        email: '',
        role: 'Patron', // Matches USER.role enum
        temporaryPassword: '', // Added password field
        user_id: '' // Added User ID field
    };
    const [newUser, setNewUser] = useState(initialUserState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    // --- End Keep ---

    // --- Currency Formatter (keep as is) ---
    const currencyFormatter = new Intl.NumberFormat('en-US', { /* ... */ });

    const userFilterOptions = () => {
        // Get the user's role from localStorage
        const userRole = localStorage.getItem('userRole');
        let roleOptions = ['Patron', 'Staff', 'Admin'];
        // If the role is 'Staff', filter out 'Admin'
        if (userRole === 'Staff') {
            roleOptions = roleOptions.filter(opt => opt !== 'Admin');
        }
        return [{
            category: 'Role',
            param: 'role', // URL parameter
            options: roleOptions
        }];
    };

    // --- Fetch Users Logic ---
    const fetchUsers = () => {
        setLoading(true);
        setError('');
        fetch(`${API_BASE_URL}/api/users`) // Fetch from backend
            .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch users'))
            .then(data => { setUsers(data || []); setLoading(false); })
            .catch(err => { console.error("Fetch Users Error:", err); setError('Could not load users.'); setLoading(false); });
    };

    useEffect(() => {
        fetchUsers(); // Fetch on mount
    }, []);
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

        try {
            const response = await fetch(`${API_BASE_URL}/api/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
                        {/* TODO: Implement user search */}
                        <input type="text" placeholder="Search users (by name, email, ID)..." className="search-result-search-bar" />
                    </div>
                </div>
                <div className="search-results-contents">
                    <div className="filter-section">
                        {userFilterOptions().map((filterGroup) => (
                            <div key={filterGroup.param} className="filter-category">
                                <h3>{filterGroup.category}</h3>
                                <hr className='divider divider--tight' />
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
                                                <p><strong>ID:</strong> {user.user_id}</p>
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
                                <hr className="divider" />
                            </div>
                        ))}
                    </div>
                    {/* --- END MODIFIED User List --- */}
                </div>
            </div>
        </div>
        {/* --- MODIFIED Add User Sheet Form --- */}
        {showAddUserSheet && (
            <div className="sheet-overlay" onClick={() => !isSubmitting && setShowAddUserSheet(false)}>
                <div className="sheet-container" onClick={(e) => e.stopPropagation()}>
                <h2>Add New User</h2>
                {submitError && <p style={{color: 'red'}}>{submitError}</p>}
                <form onSubmit={handleAddUserSubmit}>
                     {/* Added User ID input */}
                    <label> User ID (Optional - auto-generates if blank): <input type="text" className="edit-input" name="user_id" value={newUser.user_id} onChange={handleInputChange} maxLength="13" /> </label>
                    <label> First Name: <input type="text" className="edit-input" name="firstName" value={newUser.firstName} onChange={handleInputChange} required /> </label>
                    <label> Last Name: <input type="text" className="edit-input" name="lastName" value={newUser.lastName} onChange={handleInputChange} required /> </label>
                    <label> Email: <input type="email" className="edit-input" name="email" value={newUser.email} onChange={handleInputChange} required /> </label>
                    {/* Added Password input */}
                    <label> Temporary Password: <input type="password" className="edit-input" name="temporaryPassword" value={newUser.temporaryPassword} onChange={handleInputChange} required /> </label>
                    <label> Role:
                        <select name="role" className="edit-input" value={newUser.role} onChange={handleInputChange} required>
                            <option value="Patron">Patron</option>
                            <option value="Staff">Staff</option>
                        </select>
                    </label>
                     {/* TODO: Add Staff Role selection if role is Staff */}
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
        {/* --- END MODIFIED --- */}
        </div>
    )
}

export default ManageUsers;