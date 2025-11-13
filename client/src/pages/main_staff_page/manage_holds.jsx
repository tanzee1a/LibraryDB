import './manage_holds.css'; // Assuming you have this CSS file
import React, { useState, useEffect } from 'react'; // --- ADDED React hooks ---
// import { FaPlus } from 'react-icons/fa'; // --- REMOVED: No Add button ---
import { Link, useSearchParams } from 'react-router-dom';
// --- REMOVED sample data/thumbnails ---

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

function ManageHolds() {
    // --- ADDED State for holds, loading, error ---
    const [holds, setHolds] = useState([]);
    const [holdStatus, setHoldStatus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchParams, setSearchParams] = useSearchParams(); // --- ADDED ---
    const query = searchParams.get('q') || '';
    const [localSearchTerm, setLocalSearchTerm] = useState(query);
    const [sort, setSort] = useState(searchParams.get('sort') || 'requested_newest');


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

    // --- Fetch Holds (Update to include filters later) ---
    const fetchHolds = () => {
        setLoading(true);
        setError('');
        const queryString = searchParams.toString(); 

        const token = localStorage.getItem('authToken'); 
        
        if (!token) {
            setError('Authentication token missing. Please log in.');
            setLoading(false); // <-- Fixed the typo here
            return;
        }

        // --- Define the headers ---
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

    // --- MODIFIED useEffect dependencies ---
    useEffect(() => {
        setLoading(true); // Start loading when params change
        setError('');

        // 1. Get Token and Check
        const token = localStorage.getItem('authToken'); 
        if (!token) {
            // Use the correct state setter (setLoading)
            setError('Authentication token missing. Please log in.');
            setLoading(false); 
            return;
        }

        // Derive current filters directly from searchParams for the fetch (rest of your logic)
        const currentFilters = {};
        filterOptions().forEach(group => {
            const paramValue = searchParams.get(group.param);
            currentFilters[group.param] = paramValue ? paramValue.split(',') : [];
        });

        const queryString = searchParams.toString();
        console.log("FETCHING with:", queryString); // Debug log

        // 2. Execute Fetch with Headers
        fetch(`${API_BASE_URL}/api/holds?${queryString}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, // CRITICAL: Authorization header
                'Content-Type': 'application/json'
            }
        })
            .then(r => {
                // Better error handling for 401/403
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

        // Fetch status options (no auth needed, keep as is)
        fetchHoldStatus();
    }, [searchParams]); // Depend ONLY on searchParams


    // --- ADDED Action Handlers ---
    const handlePickup = (holdId) => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert("Error: You must be logged in to perform this action.");
            return;
        }

        fetch(`${API_BASE_URL}/api/holds/${holdId}/pickup`, { method: 'POST' , headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }})
            .then(r => { if (!r.ok) throw new Error('Pickup failed'); return r.json(); })
            .then((data) => {
                 console.log(data.message); // Log success
                 fetchHolds(); // Refresh list
            })
            .catch(err => alert(`Error processing pickup: ${err.message}`));
    };

    const handleCancel = (holdId) => {
        if (!window.confirm('Are you sure you want to cancel this hold? The item will become available.')) {
             return;
        }
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert("Error: You must be logged in to perform this action.");
            return;
        }
        fetch(`${API_BASE_URL}/api/holds/${holdId}/cancel`, { method: 'POST', headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }})
            .then(r => { if (!r.ok) throw new Error('Cancel failed'); return r.json(); })
            .then((data) => {
                console.log(data.message); // Log success
                fetchHolds(); // Refresh list
            })
            .catch(err => alert(`Error canceling hold: ${err.message}`));
    };

    const handleSortChange = (event) => {
        const sortType = event.target.value;
        setSort(sortType); // Update local state for the dropdown

        // Get current params to preserve filters/search
        const currentParams = Object.fromEntries(searchParams.entries());
        const next = new URLSearchParams(currentParams);

        next.set('sort', sortType);
        
        // Set the new URL, which triggers useEffect to refetch
        setSearchParams(next);
    };

    // --- ADDED: Filter Change Handler ---
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

        // Push back to URL so useEffect + fetchHolds run
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
            {/* Use existing search result styles? Adapt class names if needed */}
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
                     {/* --- RESTORED Filter section --- */}
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
                                        
                                        // --- ADD isChecked calculation HERE ---
                                        const isChecked = (searchParams.get(filterGroup.param) || '')
                                                            .split(',')
                                                            .includes(option);
                                        // --- END ADD ---

                                        return ( // Start returning the list item
                                            <li key={option}>
                                                <label>
                                                    <input 
                                                        type="checkbox" 
                                                        value={option}
                                                        // --- Use isChecked variable HERE ---
                                                        checked={isChecked} 
                                                        onChange={() => handleFilterChange(filterGroup.param, option)}
                                                    /> {option}
                                                </label>
                                            </li>
                                        ); // End returning list item
                                    })} {/* End options.map */}
                                </ul>
                            </div>
                        ))} {/* End filterOptions.map */}
                     </div>
                     {/* --- END RESTORED Filter --- */}

                    {/* --- MODIFIED Results List --- */}
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
                                        {/* Use thumbnail_url from API */}
                                        <img 
                                            src={hold.thumbnail_url || '/placeholder-image.png'} 
                                            alt={hold.item_title} 
                                            className="result-thumbnail" 
                                            onError={(e) => { e.target.onerror = null; e.target.src='/placeholder-image.png'; }}
                                        />
                                    </div>
                                    <div className='result-text-info'>
                                        <div className='result-title-header'>
                                            {/* Use hold_id from API */}
                                            <h3 className="result-title">Hold #{hold.hold_id}</h3> 
                                            {/* Status is implicitly 'Pending' */}
                                            <p className={`result-status status-${hold.hold_status?.replace(/\s+/g, '-').toLowerCase()}`}>{hold.hold_status || 'Unknown'}</p>
                                        </div>
                                        <div className="result-description">
                                            <div className="result-details">
                                                {/* Use Link and data from API */}
                                                <p><Link to={`/item/${hold.item_id}`} className="result-link">{hold.item_title || 'Unknown Item'}</Link></p>
                                                {/* TODO: Add link to user profile page if available */}
                                                <p><small><strong>User:</strong> {hold.firstName} {hold.lastName} ({hold.email})</small></p>
                                                <p><small><strong>Item ID:</strong> {hold.item_id}</small></p>
                                                <p><small><strong>Requested:</strong> {hold.created_at ? new Date(hold.created_at).toLocaleString() : '-'}</small></p>
                                                <p><small><strong>Expires:</strong> {hold.expires_at ? new Date(hold.expires_at).toLocaleString() : '-'}</small></p>
                                                <p><small><strong>Location:</strong> {hold.shelf_location || '-'}</small></p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="result-actions">
                                        {/* --- MODIFIED: Show buttons only if Pending --- */}
                                        {hold.hold_status === 'Pending Pickup' && (
                                            <>
                                                <button onClick={() => handlePickup(hold.hold_id)} className="action-button primary-button">Mark Picked Up</button>
                                                <button onClick={() => handleCancel(hold.hold_id)} className="action-button secondary-button">Cancel Hold</button>
                                            </>
                                        )}
                                         {/* Optionally show link to borrow record if Picked Up */}
                                         {hold.hold_status === 'Picked Up' && (
                                             <small>Picked up on {new Date(hold.picked_up_at).toLocaleDateString()}</small>
                                             // TODO: Link to borrow record if possible
                                         )}
                                          {hold.hold_status === 'Canceled' && (
                                             <small>Canceled on {new Date(hold.canceled_at).toLocaleDateString()}</small>
                                         )}
                                          {hold.hold_status === 'Expired' && (
                                             <small>Expired on {new Date(hold.expires_at).toLocaleDateString()}</small>
                                         )}
                                        {/* --- END MODIFIED --- */}
                                    </div>
                                </div>
                                <hr className="thin-divider" />
                                </div>
                            )
                        })}
                    </div>
                     {/* --- END MODIFIED Results --- */}
                </div>
            </div>
        </div>
        {/* --- REMOVED Add Hold Sheet JSX --- */}
        </div>
    )
}


export default ManageHolds;