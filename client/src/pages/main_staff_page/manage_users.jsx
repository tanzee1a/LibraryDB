import './manage_users.css'
import sampleData from '../../assets/sample_data.json'

import { FaPlus } from "react-icons/fa"
import { useState } from 'react'

function ManageUsers() {
    const users = sampleData.users;
    const multipleUsers = [...users, ...users, ...users];
    const currencyFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    });

    const [showAddUserSheet, setShowAddUserSheet] = useState(false);
    const [newUser, setNewUser] = useState({
        first_name: '',
        last_name: '',
        email: '',
        role: 'Patron'
    });

    function handleInputChange(e) {
        const { name, value } = e.target;
        setNewUser(prev => ({ ...prev, [name]: value }));
    }

    function handleAddUserSubmit(e) {
        e.preventDefault();
        console.log("New User Added:", newUser);
        // Here, you could send `newUser` to your backend or update the UI state.
        setShowAddUserSheet(false);
    }

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
                        <input type="text" placeholder="Search users..." className="search-result-search-bar" />
                    </div>
                </div>
                <div className="search-results-contents">
                    <div className="search-results-list">
                        {multipleUsers.map((user) => (
                            <div key={user.id} className="search-result-item">
                                <div className="result-info">
                                    <div className='result-text-info'>
                                        {/* The link should be href={`/user/${user.id}`} when not testing.*/}
                                        <h2 className='result-title'><a href={`/user`} className="result-link">{user.first_name} {user.last_name}</a></h2>
                                        <div className="result-description">
                                            <div className="result-details">
                                                <p><strong>Email:</strong> {user.email}</p>
                                                <p><strong>Role:</strong> {user.role}</p>
                                            </div>
                                            <div className="result-details">
                                                <p><strong>Current Borrows:</strong> {user.current_borrows}</p>
                                                <p><strong>Active Holds:</strong> {user.active_holds}</p>
                                                <p><strong>Outstanding Fines:</strong> {currencyFormatter.format(user.outstanding_fines)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <hr className="divider" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
        {showAddUserSheet && (
            <div className="sheet-overlay" onClick={() => setShowAddUserSheet(false)}>
                <div className="sheet-container" onClick={(e) => e.stopPropagation()}>
                <h2>Add New User</h2>
                <form onSubmit={handleAddUserSubmit}>
                    <label>
                    First Name:
                    <input
                        type="text"
                        name="first_name"
                        value={newUser.first_name}
                        onChange={handleInputChange}
                        required
                    />
                    </label>
                    <label>
                    Last Name:
                    <input
                        type="text"
                        name="last_name"
                        value={newUser.last_name}
                        onChange={handleInputChange}
                        required
                    />
                    </label>
                    <label>
                    Email:
                    <input
                        type="email"
                        name="email"
                        value={newUser.email}
                        onChange={handleInputChange}
                        required
                    />
                    </label>
                    <label>
                    Role:
                    <select
                        name="role"
                        value={newUser.role}
                        onChange={handleInputChange}
                    >
                        <option value="Patron">Patron</option>
                        <option value="Staff">Staff</option>
                    </select>
                    </label>
                    <div className="sheet-actions">
                    <button type="submit" className="action-button primary-button">Add User</button>
                    <button
                        type="button"
                        className="action-button secondary-button"
                        onClick={() => setShowAddUserSheet(false)}
                    >Cancel
                    </button>
                    </div>
                </form>
                </div>
            </div>
        )}
        </div>
    )
}

export default ManageUsers