import './manage_holds.css'; 
import React, { useState, useEffect } from 'react'; 
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

function ManageHolds() {
    const [holds, setHolds] = useState([]);
    const [holdStatus, setHoldStatus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchParams, setSearchParams] = useSearchParams(); 
    const query = searchParams.get('q') || '';
    const [localSearchTerm, setLocalSearchTerm] = useState(query);
    const [sort, setSort] = useState(searchParams.get('sort') || 'requested_newest');
    const [showCancelSheet, setShowCancelSheet] = useState(false);
    const [cancelTargetHold, setCancelTargetHold] = useState(null); 
    const [isCanceling, setIsCanceling] = useState(false);


    const filterOptions = () => {
        return [{
            category: 'Status',
            param: 'status',
            options: holdStatus.map(status => status.status_name)
        }]
    };

    const fetchHoldStatus = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/status/hold`);
            if (!response.ok) throw new Error('Failed to fetch hold status');
            const data = await response.json();
            setHoldStatus(data);
        } catch (err) {
            console.error('Error fetching hold status:', err);
        }
    };

    const fetchHolds = () => {
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

        fetch(`${API_BASE_URL}/api/holds?${queryString}`, {
        method: 'GET',
        headers: authHeaders
        })
            .then(r => { if (!r.ok) throw new Error('Network response failed'); return r.json(); })
            .then(data => { setHolds(data || []); setLoading(false); })
            .catch(err => { console.error("Fetch Holds Error:", err); setError('Could not load holds.'); setLoading(false); });
    };

    useEffect(() => {
        setLoading(true); 

        // 1. Get Token and Check
        const token = localStorage.getItem('authToken'); 
        if (!token) {
            setError('Authentication token missing. Please log in.');
            setLoading(false); 
            return;
        }

        const currentFilters = {};
        filterOptions().forEach(group => {
            const paramValue = searchParams.get(group.param);
            currentFilters[group.param] = paramValue ? paramValue.split(',') : [];
        });

        const queryString = searchParams.toString();
        console.log("FETCHING with:", queryString); 

        // 2. Execute Fetch with Headers
        fetch(`${API_BASE_URL}/api/holds?${queryString}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json'
            }
        })
            .then(r => {
                if (r.status === 401 || r.status === 403) {
                    throw new Error('Unauthorized or Forbidden access.');
                }
                if (!r.ok) throw new Error(`Network response failed (${r.status})`);
                return r.json();
            })
            .then(data => {
                console.log("Received holds:", data.length);
                setHolds(data || []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Fetch Holds Error:", err);
                setError(`Could not load holds. (${err.message})`);
                setLoading(false);
            });

        fetchHoldStatus();
    }, [searchParams]); 

    const handlePickup = async (holdId) => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            toast.error("Error: You must be logged in to perform this action.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/holds/${holdId}/pickup`, { 
                method: 'POST' , 
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Pickup failed');
            }

            await response.json();
            toast.success("Hold marked as picked up!"); // Success toast!
            fetchHolds(); // Refresh list

        } catch (err) {
            toast.error(`Error processing pickup: ${err.message}`); // Error toast!
        }
    };

    const handleCancelClick = (hold) => {
        setCancelTargetHold(hold); // Store the hold object
        setShowCancelSheet(true);  // Open the sheet
    };

    const handleConfirmCancel = async () => {
        if (!cancelTargetHold) return;

        setIsCanceling(true);

        const token = localStorage.getItem('authToken');
        if (!token) {
            toast.error("Error: You must be logged in.");
            setIsCanceling(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/holds/${cancelTargetHold.hold_id}/cancel`, {
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
            setShowCancelSheet(false);
            setCancelTargetHold(null);
            fetchHolds(); 
            toast.success("Hold canceled successfully!"); // Success toast!

        } catch (err) {
            toast.error(`Error canceling hold: ${err.message}`); // Error toast!
        } finally {
            setIsCanceling(false);
        }
    };

    const handleSortChange = (event) => {
        const sortType = event.target.value;
        setSort(sortType); // Update local state for the dropdown

        const currentParams = Object.fromEntries(searchParams.entries());
        const next = new URLSearchParams(currentParams);

        next.set('sort', sortType);
        
        setSearchParams(next);
    };

    const handleFilterChange = (param, option) => {
        const currentValues = (searchParams.get(param) || '')
            .split(',')
            .filter(Boolean);

        let newValues;
        if (currentValues.includes(option)) {
            newValues = currentValues.filter(v => v !== option);
        } else {
            newValues = [...currentValues, option];
        }

        const next = new URLSearchParams(searchParams);
        if (newValues.length) {
            next.set(param, newValues.join(','));
        } else {
            next.delete(param);
        }
        setSearchParams(next);
    };

    const handleSearch = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const term = localSearchTerm.trim();
            const currentParams = Object.fromEntries(searchParams.entries());

            if (term) {
                setSearchParams({ ...currentParams, q: term });
            } else {
                delete currentParams.q;
                setSearchParams(currentParams);
            }
        }
    };


    return (
        <div>
        <div className="page-container">
            <div className='search-result-page-container'> 
                <div className="search-result-header">
                    <h1>Manage Holds (Pending Pickups)</h1>
                    <div className="search-result-search-bar-container">
                        <input 
                            type="text" 
                            placeholder="Search holds (by user, item...)" 
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
                                value={sort} // Use state
                                onChange={handleSortChange} // Use handler
                            >
                                <option value="requested_newest">Requested Date (Newest)</option>
                                <option value="requested_oldest">Requested Date (Oldest)</option>
                                <option value="expires_soonest">Expires Soonest</option>
                                <option value="expires_latest">Expires Latest</option>
                                <option value="title_asc">Title (A–Z)</option>
                                <option value="title_desc">Title (Z–A)</option>
                            </select>
                        </div>
                        {filterOptions().map((filterGroup) => (
                            <div key={filterGroup.param} className="filter-category">
                                <h3>{filterGroup.category}</h3>
                                <hr className='thin-divider divider--tight' />
                                <ul>
                                    {filterGroup.options.map((option) => {
                                        
                                        const isChecked = (searchParams.get(filterGroup.param) || '')
                                                            .split(',')
                                                            .includes(option);

                                        return ( 
                                            <li key={option}>
                                                <label>
                                                    <input 
                                                        type="checkbox" 
                                                        value={option}
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

                    <div className="search-results-list">
                        {loading && <p>Loading pending pickups...</p>}
                        {error && <p style={{ color: 'red' }}>{error}</p>}
                        {!loading && !error && holds.length === 0 && <p>No items are currently pending pickup.</p>}

                        {!loading && !error && holds.map((hold) => { // Use 'holds' state
                            return (
                                // Use hold_id for the key
                                <div key={hold.hold_id} className={`search-result-item ${hold.category?.toLowerCase() || 'default'}`}> 
                                    <div className="result-info">
                                    <div>
                                        <img 
                                            src={hold.thumbnail_url || '/placeholder-image.png'} 
                                            alt={hold.item_title} 
                                            className="result-thumbnail" 
                                            onError={(e) => { e.target.onerror = null; e.target.src='/placeholder-image.png'; }}
                                        />
                                    </div>
                                    <div className='result-text-info'>
                                        <div className='result-title-header'>
                                            <h3 className="result-title">Hold #{hold.hold_id}</h3> 
                                            <p className={`result-status status-${hold.hold_status?.replace(/\s+/g, '-').toLowerCase()}`}>{hold.hold_status || 'Unknown'}</p>
                                        </div>
                                        <div className="result-description">
                                            <div className="result-details">
                                                <p><Link to={`/item/${hold.item_id}`} className="result-link">{hold.item_title || 'Unknown Item'}</Link></p>
                                                <p><small><strong>User:</strong> {hold.firstName} {hold.lastName} ({hold.email})</small></p>
                                                <p><small><strong>Item ID:</strong> {hold.item_id}</small></p>
                                                <p><small><strong>Requested:</strong> {hold.created_at ? new Date(hold.created_at).toLocaleString() : '-'}</small></p>
                                                <p><small><strong>Expires:</strong> {hold.expires_at ? new Date(hold.expires_at).toLocaleString() : '-'}</small></p>
                                                <p><small><strong>Location:</strong> {hold.shelf_location || '-'}</small></p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="result-actions">
                                        {hold.hold_status === 'Pending Pickup' && (
                                            <>
                                                <button onClick={() => handlePickup(hold.hold_id)} className="action-button primary-button">Mark Picked Up</button>
                                                <button onClick={() => handleCancelClick(hold)} className="action-button secondary-button">Cancel Hold</button>
                                            </>
                                        )}
                                         {hold.hold_status === 'Picked Up' && (
                                             <small>Picked up on {new Date(hold.picked_up_at).toLocaleDateString()}</small>
                                         )}
                                          {hold.hold_status === 'Canceled' && (
                                             <small>Canceled on {new Date(hold.canceled_at).toLocaleDateString()}</small>
                                         )}
                                          {hold.hold_status === 'Expired' && (
                                             <small>Expired on {new Date(hold.expires_at).toLocaleDateString()}</small>
                                         )}
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
        {showCancelSheet && cancelTargetHold && (
            <div className="sheet-overlay" onClick={() => !isCanceling && setShowCancelSheet(false)}>
                <div className="sheet-container" onClick={(e) => e.stopPropagation()}>
                    <h2>Cancel Hold Confirmation</h2>
                    <p>Are you sure you want to cancel <strong>Hold #{cancelTargetHold.hold_id}</strong>?</p>
                    {/* ...details... */}

                    {/* No need for {cancelError} p tag here anymore */}

                    <div className="sheet-actions">
                        <button 
                            type="button" 
                            className="action-button red-button" 
                            onClick={handleConfirmCancel} 
                            disabled={isCanceling}
                        >
                            {isCanceling ? 'Canceling...' : 'Yes, Cancel Hold'}
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


export default ManageHolds;