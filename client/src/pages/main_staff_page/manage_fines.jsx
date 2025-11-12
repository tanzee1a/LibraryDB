import './manage_fines.css';
import React, { useState, useEffect } from 'react';
import { FaPlus } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; 

function ManageFines() {
    
    const [fines, setFines] = useState([]);
    const [fineStatus, setFineStatus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showAddFineSheet, setShowAddFineSheet] = useState(false);
    const initialFineState = {
        user_id: '',
        borrow_id: '',
        fee_type: 'DAMAGED',
        amount: '',
        notes: ''
    };
    const [newFine, setNewFine] = useState(initialFineState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const currencyFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });

    // Helper to filter options (uses fineStatus state)
    const filterOptions = () => {
        return [{
            category: 'Status',
            param: 'status',
            options: fineStatus.map(status => status.status_name)
        }]
    };

    // Fetches possible fine status options from API
    const fetchFineStatus = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/status/fine`);
            if (!response.ok) throw new Error('Failed to fetch fine status');
            const data = await response.json();
            setFineStatus(data);
        } catch (err) {
            console.error('Error fetching fine status:', err);
        }
    };

    // 🌟 CORRECTED: Added Auth Token to fetchFines 🌟
    const fetchFines = () => {
        setLoading(true);
        setError('');
        
        const token = localStorage.getItem('authToken'); 
        if (!token) {
            setError('Authentication token missing. Please log in as staff.');
            setLoading(false); 
            return;
        }

        fetch(`${API_BASE_URL}/api/fines`, { 
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, // CRITICAL: Authorization header
                'Content-Type': 'application/json'
            }
        }) 
            .then(res => {
                if (res.status === 401 || res.status === 403) {
                    throw new Error('Unauthorized access or insufficient privileges.');
                }
                if (!res.ok) {
                    return res.json().catch(() => Promise.reject(`HTTP error ${res.status}`)).then(err => {
                        throw new Error(err.message || `HTTP error ${res.status}`);
                    });
                }
                return res.json();
            })
            .then(data => { 
                setFines(data || []); 
                setLoading(false); 
            })
            .catch(err => { 
                console.error("Fetch Fines Error:", err); 
                setError(`Could not load fines. (${err.message})`); 
                setLoading(false); 
            });
    };

    useEffect(() => {
        fetchFines(); 
        fetchFineStatus()
    }, []);

    // 🌟 CORRECTED: Added Auth Token to handleMarkPaid 🌟
    const handleMarkPaid = (fineId) => {
        const token = localStorage.getItem('authToken');
        if (!token) { alert('Authentication required.'); return; }

         fetch(`${API_BASE_URL}/api/fines/${fineId}/pay`, { 
             method: 'POST',
             headers: {'Authorization': `Bearer ${token}`} // <-- Added Token
         })
            .then(r => { if (!r.ok) throw new Error('Marking paid failed'); return r.json(); })
            .then(() => fetchFines()) // Refresh list
            .catch(err => alert(`Error marking paid: ${err.message}`));
    };

    // 🌟 CORRECTED: Added Auth Token to handleWaive 🌟
    const handleWaive = (fineId) => {
        const token = localStorage.getItem('authToken');
        if (!token) { alert('Authentication required.'); return; }

        const reason = prompt("Enter reason for waiving the fine:");
        if (reason === null || reason.trim() === '') {
            alert("Waive canceled or reason not provided.");
            return; 
        }
        
        fetch(`${API_BASE_URL}/api/fines/${fineId}/waive`, { 
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // <-- Added Token
            },
            body: JSON.stringify({ reason: reason.trim() }) 
        })
            .then(r => { if (!r.ok) throw new Error('Waiving fine failed'); return r.json(); })
            .then(() => fetchFines())
            .catch(err => alert(`Error waiving fine: ${err.message}`));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewFine(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSortChange = (sortType) => {
        console.log("Sort by:", sortType);
        // Sorting logic remains the same (placeholder)
    };

    // 🌟 CORRECTED: Added Auth Token to handleAddFineSubmit 🌟
    async function handleAddFineSubmit(e) {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError('');

        const token = localStorage.getItem('authToken'); 
        if (!token) {
            setSubmitError('Authentication required to add fines.');
            setIsSubmitting(false);
            return;
        }

        try {
            if (parseFloat(newFine.amount) <= 0 || isNaN(parseFloat(newFine.amount))) {
                 throw new Error('Amount must be a positive number.');
            }

            const response = await fetch(`${API_BASE_URL}/api/fines`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // <-- Added Token
                },
                body: JSON.stringify({
                    borrow_id: newFine.borrow_id,
                    user_id: newFine.user_id,
                    fee_type: newFine.fee_type,
                    amount: parseFloat(newFine.amount),
                    notes: newFine.notes
                }) 
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error ${response.status}`);
            }

            console.log("New Fine Added:", await response.json());
            setShowAddFineSheet(false);
            setNewFine(initialFineState); 
            fetchFines();

        } catch (err) {
            console.error("Add Fine Error:", err);
            setSubmitError(`Failed to add fine: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    }

    const getFineStatus = (fine) => {
        if (fine.date_paid) return { text: 'Paid', className: 'status-paid' };
        if (fine.waived_at) return { text: 'Waived', className: 'status-waived' };
        return { text: 'Unpaid', className: 'status-unpaid' };
    };

    return (
        <div>
        <div className="page-container">
            <div className='search-result-page-container'>
                <div className="search-result-header">
                    <h1>Manage Fines</h1>
                    <div className="search-result-search-bar-container">
                        <button
                            className="action-circle-button primary-button"
                            onClick={() => setShowAddFineSheet(true)}
                            >
                            <FaPlus />
                        </button>
                        <input type="text" placeholder="Search fines (by user, borrow ID)..." className="search-result-search-bar" />
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
                                        return (
                                            <li key={option}>
                                                <label>
                                                    <input 
                                                        type="checkbox" 
                                                        value={option}
                                                    /> {option}
                                                </label>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="search-results-list" style={{width: '100%'}}>
                        {loading && <p>Loading fines...</p>}
                        {error && <p style={{ color: 'red' }}>{error}</p>}
                        {!loading && !error && fines.length === 0 && <p>No fines found.</p>}

                        {!loading && !error && fines.map((fine) => {
                            const statusInfo = getFineStatus(fine);
                            return (
                            <div key={fine.fine_id} className="search-result-item"> 
                                <div className="result-info">
                                    <div className='result-text-info'>
                                        <div className='result-title-header'>
                                            <h3 className="result-title">Fine #{fine.fine_id} ({fine.fee_type})</h3>
                                            <p className={`result-status ${statusInfo.className}`}>{statusInfo.text}</p> 
                                        </div>
                                        <div className="result-description">
                                            <div className="result-details">
                                                <p><small><strong>Borrow ID:</strong> {fine.borrow_id}</small></p>
                                                <p><small><strong>User:</strong> <Link to={`/user/${fine.user_id}`} className="result-link">{fine.firstName} {fine.lastName}</Link></small></p>
                                                <p><small><strong>Item:</strong> {fine.item_title || '(Item details unavailable)'}</small></p>
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
                                                 <button onClick={() => handleMarkPaid(fine.fine_id)} className="action-button primary-button">Mark Paid</button>
                                                 <button onClick={() => handleWaive(fine.fine_id)} className="action-button secondary-button">Waive Fine</button>
                                             </>
                                         )}
                                    </div>
                                </div>
                                <hr className="thin-divider" />
                            </div>
                        )})}
                    </div>
                </div>
            </div>
        </div>
        {showAddFineSheet && (
            <div className="sheet-overlay" onClick={() => !isSubmitting && setShowAddFineSheet(false)}>
                <div className="sheet-container" onClick={(e) => e.stopPropagation()}>
                <h2>Add New Fine (Manual)</h2>
                {submitError && <p style={{color: 'red'}}>{submitError}</p>}
                <form onSubmit={handleAddFineSubmit}>
                    <label> User Email: <input type="text" className="edit-input" name="user_email" value={newFine.user_email} onChange={handleInputChange} required /> </label>
                    <label> Borrow ID: <input type="text" className="edit-input" name="borrow_id" value={newFine.borrow_id} onChange={handleInputChange} required /> </label>
                    <label> Fee Type:
                        <select name="fee_type" className="edit-input" value={newFine.fee_type} onChange={handleInputChange} required>
                            <option value="DAMAGED">Damaged Item</option>
                            <option value="LOST">Lost Item</option>
                            <option value="LATE">Late Return (Manual)</option> 
                        </select>
                    </label>
                    <label> Amount: <input type="number" className="edit-input" name="amount" value={newFine.amount} onChange={handleInputChange} required step="0.01" min="0.01"/> </label>
                    <label> Notes (Optional): <textarea className="edit-input" name="notes" value={newFine.notes} onChange={handleInputChange} /> </label>

                    <div className="sheet-actions">
                    <button type="submit" className="action-button primary-button" disabled={isSubmitting}>
                         {isSubmitting ? 'Adding...' : 'Add Fine'}
                    </button>
                    <button type="button" className="action-button secondary-button" onClick={() => setShowAddFineSheet(false)} disabled={isSubmitting}>
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

export default ManageFines;