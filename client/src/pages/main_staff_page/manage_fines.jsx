import './manage_fines.css';
// --- REMOVED sampleData ---
import React, { useState, useEffect } from 'react'; // --- ADDED useEffect ---
import { FaPlus } from 'react-icons/fa';
import { Link } from 'react-router-dom'; // --- ADDED Link ---

// --- ADDED API_BASE_URL ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; 

function ManageFines() {
    // --- ADDED State for fines, loading, error ---
    const [fines, setFines] = useState([]);
    const [fineStatus, setFineStatus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    // --- END ADDED ---

    // --- Keep Add Fine Sheet state/handlers ---
    const [showAddFineSheet, setShowAddFineSheet] = useState(false);
    const initialFineState = {
        user_id: '', // Changed from user_email
        borrow_id: '',
        fee_type: 'DAMAGED', // Default to DAMAGED for manual entry
        amount: '',
        notes: '' // Added notes field
    };
    const [newFine, setNewFine] = useState(initialFineState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    // --- End Keep ---

    // --- Currency Formatter (keep as is) ---
    const currencyFormatter = new Intl.NumberFormat('en-US', { /* ... */ });

    const filterOptions = () => {
        return [{
            category: 'Status',
            param: 'status',
            options: fineStatus.map(status => status.status_name)
        }]
    };

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

    // --- Fetch Fines Logic ---
    const fetchFines = () => {
        setLoading(true);
        setError('');
        fetch(`${API_BASE_URL}/api/fines`) // Fetch from backend
            .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch fines'))
            .then(data => { setFines(data || []); setLoading(false); })
            .catch(err => { console.error("Fetch Fines Error:", err); setError('Could not load fines.'); setLoading(false); });
    };

    useEffect(() => {
        fetchFines(); // Fetch on mount
        fetchFineStatus()
    }, []);
    // --- End Fetch ---

    // --- Action Button Handlers ---
    const handleMarkPaid = (fineId) => {
         fetch(`${API_BASE_URL}/api/fines/${fineId}/pay`, { method: 'POST' })
            .then(r => { if (!r.ok) throw new Error('Marking paid failed'); return r.json(); })
            .then(() => fetchFines()) // Refresh list
            .catch(err => alert(`Error marking paid: ${err.message}`));
    };

    const handleWaive = (fineId) => {
        const reason = prompt("Enter reason for waiving the fine:");
        if (reason === null || reason.trim() === '') { // Handle cancel or empty reason
            alert("Waive canceled or reason not provided.");
            return; 
        }
        fetch(`${API_BASE_URL}/api/fines/${fineId}/waive`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: reason.trim() }) 
        })
            .then(r => { if (!r.ok) throw new Error('Waiving fine failed'); return r.json(); })
            .then(() => fetchFines()) // Refresh list
            .catch(err => alert(`Error waiving fine: ${err.message}`));
    };

    // Remove old renderFineActionButtons function
    // --- End Action Buttons ---

    // --- handleInputChange (remains the same) ---
    // Inside ManageFines component
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        // Optional: log to check
        // console.log(`Fine Input: Name=${name}, Value=${value}`); 
        setNewFine(prev => ({
            ...prev, // Keep other state values
            [name]: value // Update the specific field
        }));
    };

    const handleSortChange = (sortType) => {
        console.log("Sort by:", sortType);
        // Example: apply sorting logic to results
        let sorted = [...fines];
        if (sortType === "title_asc") sorted.sort((a, b) => a.title.localeCompare(b.title));
        if (sortType === "title_desc") sorted.sort((a, b) => b.title.localeCompare(a.title));
        if (sortType === "newest") sorted.sort((a, b) => (b.release_year || 0) - (a.release_year || 0));
        if (sortType === "oldest") sorted.sort((a, b) => (a.release_year || 0) - (b.release_year || 0));
        setFines(sorted);
    };

    // --- MODIFIED: handleAddFineSubmit ---
    async function handleAddFineSubmit(e) { // Make async
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError('');

        try {
            // Basic frontend validation
            if (parseFloat(newFine.amount) <= 0) {
                 throw new Error('Amount must be positive.');
            }

            const response = await fetch(`${API_BASE_URL}/api/fines`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Send the state directly (ensure names match backend expectations)
                body: JSON.stringify({
                    borrow_id: newFine.borrow_id,
                    user_id: newFine.user_id,
                    fee_type: newFine.fee_type,
                    amount: parseFloat(newFine.amount), // Ensure amount is a number
                    notes: newFine.notes
                }) 
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error ${response.status}`);
            }

            // Success
            console.log("New Fine Added:", await response.json());
            setShowAddFineSheet(false);
            setNewFine(initialFineState); // Reset form
            fetchFines(); // Refresh fine list

        } catch (err) {
            console.error("Add Fine Error:", err);
            setSubmitError(`Failed to add fine: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    }
    // --- END MODIFIED ---


    // --- Helper function to determine fine status ---
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
                            <FaPlus /> {/* Keep Add Button */}
                        </button>
                        {/* TODO: Implement fine search */}
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

                    {/* --- MODIFIED Fine List --- */}
                     {/* Make list full width if no filter */}
                    <div className="search-results-list" style={{width: '100%'}}>
                        {loading && <p>Loading fines...</p>}
                        {error && <p style={{ color: 'red' }}>{error}</p>}
                        {!loading && !error && fines.length === 0 && <p>No fines found.</p>}

                        {/* Map over fetched 'fines' state */}
                        {!loading && !error && fines.map((fine) => {
                            const statusInfo = getFineStatus(fine);
                            return (
                            // Use fine_id for the key
                            <div key={fine.fine_id} className="search-result-item"> 
                                <div className="result-info">
                                    <div className='result-text-info'>
                                        <div className='result-title-header'>
                                            <h3 className="result-title">Fine #{fine.fine_id} ({fine.fee_type})</h3>
                                            {/* Display calculated status */}
                                            <p className={`result-status ${statusInfo.className}`}>{statusInfo.text}</p> 
                                        </div>
                                        <div className="result-description">
                                            <div className="result-details">
                                                <p><small><strong>Borrow ID:</strong> {fine.borrow_id}</small></p>
                                                {/* Link to user profile */}
                                                <p><small><strong>User:</strong> <Link to={`/user/${fine.user_id}`} className="result-link">{fine.firstName} {fine.lastName}</Link> ({fine.user_id})</small></p>
                                                <p><small><strong>Item:</strong> {fine.item_title || '(Item details unavailable)'}</small></p>
                                                <p><strong>Amount:</strong> {currencyFormatter.format(fine.amount)}</p>
                                                <p><small><strong>Issued:</strong> {new Date(fine.date_issued).toLocaleString()}</small></p>
                                                <p><small><strong>Paid:</strong> {fine.date_paid ? new Date(fine.date_paid).toLocaleString() : '-'}</small></p>
                                                <p><small><strong>Waived:</strong> {fine.waived_at ? new Date(fine.waived_at).toLocaleString() : '-'} {fine.waived_reason ? `(${fine.waived_reason})` : ''}</small></p>
                                                {fine.notes && <p><small><strong>Notes:</strong> {fine.notes}</small></p>}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Action Buttons */}
                                    <div className="result-actions">
                                         {/* Show buttons only if unpaid and unwaived */}
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
                    {/* --- END MODIFIED Fine List --- */}
                </div>
            </div>
        </div>
        {/* --- MODIFIED Add Fine Sheet Form --- */}
        {showAddFineSheet && (
            <div className="sheet-overlay" onClick={() => !isSubmitting && setShowAddFineSheet(false)}>
                <div className="sheet-container" onClick={(e) => e.stopPropagation()}>
                <h2>Add New Fine (Manual)</h2>
                {submitError && <p style={{color: 'red'}}>{submitError}</p>}
                <form onSubmit={handleAddFineSubmit}>
                    {/* Changed user_email to user_id */}
                    <label> User ID: <input type="text" className="edit-input" name="user_id" value={newFine.user_id} onChange={handleInputChange} required /> </label>
                    <label> Borrow ID: <input type="text" className="edit-input" name="borrow_id" value={newFine.borrow_id} onChange={handleInputChange} required /> </label>
                    <label> Fee Type:
                        <select name="fee_type" className="edit-input" value={newFine.fee_type} onChange={handleInputChange} required>
                            <option value="DAMAGED">Damaged Item</option>
                            <option value="LOST">Lost Item</option>
                            <option value="LATE">Late Return (Manual)</option> 
                        </select>
                    </label>
                    <label> Amount: <input type="number" className="edit-input" name="amount" value={newFine.amount} onChange={handleInputChange} required step="0.01" min="0.01"/> </label>
                    {/* Added Notes field */}
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
        {/* --- END MODIFIED --- */}
        </div>
    )
}

export default ManageFines;