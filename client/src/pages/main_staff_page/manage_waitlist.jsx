import './manage_waitlist.css'; 
import React, { useState, useEffect } from 'react'; 
import { Link, useSearchParams } from 'react-router-dom';
import { IoListOutline } from 'react-icons/io5';
import { FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

function ManageWaitlist() {
    const [waitlist, setWaitlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchParams, setSearchParams] = useSearchParams(); 
    const query = searchParams.get('q') || '';
    const [localSearchTerm, setLocalSearchTerm] = useState(query);
    const [sort, setSort] = useState(searchParams.get('sort') || 'requested_oldest');

    const [showAddWaitlistSheet, setShowAddWaitlistSheet] = useState(false);
    const initialWaitlistState = {
        email: '',
        itemId: ''
    };
    const [newWaitlistEntry, setNewWaitlistEntry] = useState(initialWaitlistState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [showCancelSheet, setShowCancelSheet] = useState(false);
    const [cancelTargetEntry, setCancelTargetEntry] = useState(null);
    const [isCanceling, setIsCanceling] = useState(false);
    
    const fetchWaitlist = () => {
        setLoading(true);
        setError('');
        const queryString = searchParams.toString(); 
        const token = localStorage.getItem('authToken'); 
        
        if (!token) {
            setError('Authentication token missing. Please log in.');
            setLoading(false); 
            return;
        }

        const authHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        };

        fetch(`${API_BASE_URL}/api/waitlist?${queryString}`, {
            method: 'GET',
            headers: authHeaders
        })
            .then(r => { if (!r.ok) throw new Error('Network response failed'); return r.json(); })
            .then(data => { setWaitlist(data || []); setLoading(false); })
            .catch(err => { console.error("Fetch Waitlist Error:", err); setError('Could not load waitlist.'); setLoading(false); });
    };

    useEffect(() => {
        fetchWaitlist();
    }, [searchParams]); 

    const handleCancelClick = (entry) => {
        setCancelTargetEntry(entry);
        setShowCancelSheet(true);
    };

    const handleConfirmCancel = async () => {
        if (!cancelTargetEntry) return;

        setIsCanceling(true);
        const token = localStorage.getItem('authToken');

        if (!token) {
            toast.error("Error: You must be logged in to perform this action.");
            setIsCanceling(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/waitlist/${cancelTargetEntry.waitlist_id}/cancel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Cancel failed');
            }

            await response.json();
            
            // Success!
            toast.success("User removed from waitlist!");
            setShowCancelSheet(false);
            setCancelTargetEntry(null);
            fetchWaitlist(); // Refresh the list

        } catch (err) {
            toast.error(`Error canceling entry: ${err.message}`);
        } finally {
            setIsCanceling(false);
        }
    };

    const handleSortChange = (event) => {
        const sortType = event.target.value;
        setSort(sortType);
        const next = new URLSearchParams(searchParams);
        next.set('sort', sortType);
        setSearchParams(next);
    };

    const handleSearch = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const term = localSearchTerm.trim();
            const next = new URLSearchParams(searchParams);
            if (term) {
                next.set('q', term);
            } else {
                next.delete('q');
            }
            setSearchParams(next);
        }
    };

    // --- 3. Input change handler ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewWaitlistEntry(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // --- 4. Form submission handler ---
    async function handleAddWaitlistSubmit(e) {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError('');

        const token = localStorage.getItem('authToken'); 
        if (!token) {
            setSubmitError('Authentication required to add entries.');
            setIsSubmitting(false);
            return;
        }

        try {
            if (!newWaitlistEntry.email || !newWaitlistEntry.itemId) {
                throw new Error('User Email and Item ID are required.');
            }

            const response = await fetch(`${API_BASE_URL}/api/staff/waitlist`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    email: newWaitlistEntry.email,
                    itemId: newWaitlistEntry.itemId
                }) 
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error ${response.status}`);
            }

            console.log("New Waitlist Entry Added:", await response.json());
            setShowAddWaitlistSheet(false);
            setNewWaitlistEntry(initialWaitlistState); 
            fetchWaitlist();

        } catch (err) {
            console.error("Add Waitlist Error:", err);
            setSubmitError(`Failed to add entry: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div>
        <div className="page-container">
            <div className='search-result-page-container'> 
                <div className="search-result-header">
                    <h1> Manage Waitlist</h1>
                    <div className="search-result-search-bar-container">
                        
                        <button
                            className="action-circle-button primary-button"
                            onClick={() => setShowAddWaitlistSheet(true)}
                            >
                            <FaPlus />
                        </button>

                        <input 
                            type="text" 
                            placeholder="Search waitlist (by user, item...)" 
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
                                value={sort} 
                                onChange={handleSortChange} 
                            >
                                <option value="requested_oldest">Requested Date (Oldest)</option>
                                <option value="requested_newest">Requested Date (Newest)</option>
                                <option value="title_asc">Title (A–Z)</option>
                                <option value="title_desc">Title (Z–A)</option>
                            </select>
                        </div>
                     </div>

                    <div className="search-results-list">
                        {loading && <p>Loading waitlist...</p>}
                        {error && <p style={{ color: 'red' }}>{error}</p>}
                        {!loading && !error && waitlist.length === 0 && <p>No items are currently on the waitlist.</p>}

                        {!loading && !error && waitlist.map((entry) => { 
                            return (
                                <div key={entry.waitlist_id} className={`search-result-item ${entry.category?.toLowerCase() || 'default'}`}> 
                                    <div className="result-info">
                                    <div>
                                        <img 
                                            src={entry.thumbnail_url || '/placeholder-image.png'} 
                                            alt={entry.item_title} 
                                            className="result-thumbnail" 
                                            onError={(e) => { e.target.onerror = null; e.target.src='/placeholder-image.png'; }}
                                        />
                                    </div>
                                    <div className='result-text-info'>
                                        <div className='result-title-header'>
                                            <h3 className="result-title">Waitlist #{entry.waitlist_id}</h3> 
                                            <p className="result-status status-on-waitlist">On Waitlist</p>
                                        </div>
                                        <div className="result-description">
                                            <div className="result-details">
                                                <p><Link to={`/item/${entry.item_id}`} className="result-link">{entry.item_title || 'Unknown Item'}</Link></p>
                                                <p><small><strong>User:</strong> {entry.firstName} {entry.lastName} ({entry.email})</small></p>
                                                <p><small><strong>Item ID:</strong> {entry.item_id}</small></p>
                                                <p><small><strong>On Waitlist Since:</strong> {entry.start_date ? new Date(entry.start_date).toLocaleString() : '-'}</small></p>
                                                <p><small><strong>Location:</strong> {entry.shelf_location || '-'}</small></p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="result-actions">
                                        <button onClick={() => handleCancelClick(entry)} className="action-button secondary-button">Remove from Waitlist</button>
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
        
        {showAddWaitlistSheet && (
            <div className="sheet-overlay" onClick={() => !isSubmitting && setShowAddWaitlistSheet(false)}>
                <div className="sheet-container" onClick={(e) => e.stopPropagation()}>
                <h2>Add User to Waitlist</h2>
                {submitError && <p style={{color: 'red'}}>{submitError}</p>}
                <form onSubmit={handleAddWaitlistSubmit}>
                    <label> User Email: <input type="email" className="edit-input" name="email" value={newWaitlistEntry.email} onChange={handleInputChange} required placeholder="e.g., patron@example.com" /> </label>
                    <label> Item ID: <input type="text" className="edit-input" name="itemId" value={newWaitlistEntry.itemId} onChange={handleInputChange} required placeholder="e.g., 9780316769488"/> </label>
                    
                    <div className="sheet-actions">
                    <button type="submit" className="action-button primary-button" disabled={isSubmitting}>
                         {isSubmitting ? 'Adding...' : 'Add to Waitlist'}
                    </button>
                    <button type="button" className="action-button secondary-button" onClick={() => setShowAddWaitlistSheet(false)} disabled={isSubmitting}>
                        Cancel
                    </button>
                    </div>
                </form>
                </div>
            </div>
        )}
        {showCancelSheet && cancelTargetEntry && (
            <div className="sheet-overlay" onClick={() => !isCanceling && setShowCancelSheet(false)}>
                <div className="sheet-container" onClick={(e) => e.stopPropagation()}>
                    <h2>Remove from Waitlist</h2>
                    <p>Are you sure you want to remove this user from the waitlist?</p>
                    
                    <div style={{ padding: '10px 0', border: '1E2D3E', borderRadius: '5px' }}>
                        <p><strong>Item:</strong> {cancelTargetEntry.item_title}</p>
                        <p><strong>User:</strong> {cancelTargetEntry.firstName} {cancelTargetEntry.lastName} ({cancelTargetEntry.email})</p>
                    </div>

                    <div className="sheet-actions">
                        <button 
                            type="button" 
                            className="action-button red-button" 
                            onClick={handleConfirmCancel} 
                            disabled={isCanceling}
                        >
                            {isCanceling ? 'Removing...' : 'Yes, Remove'}
                        </button>
                        <button 
                            type="button" 
                            className="action-button secondary-button" 
                            onClick={() => setShowCancelSheet(false)} 
                            disabled={isCanceling}
                        >
                            Nevermind
                        </button>
                    </div>
                </div>
            </div>
        )}

        </div>
    )
}

export default ManageWaitlist;