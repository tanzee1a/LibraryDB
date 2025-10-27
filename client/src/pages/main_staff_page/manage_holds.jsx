import './manage_holds.css'; // Assuming you have this CSS file
import React, { useState, useEffect } from 'react'; // --- ADDED React hooks ---
// import { FaPlus } from 'react-icons/fa'; // --- REMOVED: No Add button ---
import { Link, useSearchParams } from 'react-router-dom';
// --- REMOVED sample data/thumbnails ---


// --- ADDED: Define filter options for Holds ---
const holdFilterOptions = [
    {
        category: 'Status',
        param: 'status', // URL parameter
        options: ['Pending Pickup', 'Picked Up', 'Canceled', 'Expired']
    },
    // TODO: Add filters for User Search, Item Search, Date Range?
];

function ManageHolds() {
    // --- ADDED State for holds, loading, error ---
    const [holds, setHolds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchParams, setSearchParams] = useSearchParams(); // --- ADDED ---
    // under: const [error, setError] = useState('');

    // --- END ADDED ---

    // --- REMOVED Add Hold Sheet state/handlers ---
    // --- End REMOVED ---

    // --- Fetch Holds (Update to include filters later) ---
    const fetchHolds = () => {
        setLoading(true);
        setError('');
        // TODO: Add filter params from selectedFilters to the fetch URL
        const queryString = searchParams.toString(); // For now, just use existing URL params

        fetch(`http://localhost:5000/api/holds?${queryString}`) // Include query string
            .then(r => { if (!r.ok) throw new Error('Network response failed'); return r.json(); })
            .then(data => { setHolds(data || []); setLoading(false); })
            .catch(err => { console.error("Fetch Holds Error:", err); setError('Could not load holds.'); setLoading(false); });
    };

    // --- MODIFIED useEffect dependencies ---
    useEffect(() => {
        setLoading(true); // Start loading when params change
        setError('');

        // Derive current filters directly from searchParams for the fetch
        const currentFilters = {};
        holdFilterOptions.forEach(group => {
            const paramValue = searchParams.get(group.param);
            currentFilters[group.param] = paramValue ? paramValue.split(',') : [];
        });

        // Construct query string for the API call
        const queryString = searchParams.toString();
        console.log("FETCHING with:", queryString); // Debug log

        fetch(`http://localhost:5000/api/holds?${queryString}`)
            .then(r => {
                if (!r.ok) throw new Error(`Network response failed (${r.status})`);
                return r.json();
            })
            .then(data => {
                console.log("Received holds:", data.length); // Debug log
                setHolds(data || []);
                setLoading(false); // Stop loading on success
            })
            .catch(err => {
                console.error("Fetch Holds Error:", err);
                setError('Could not load holds.');
                setLoading(false); // Stop loading on error
            });

        // No need to call setSelectedFilters here anymore

    }, [searchParams]); // Depend ONLY on searchParams

    // --- END MODIFIED ---

    // --- ADDED Action Handlers ---
    const handlePickup = (holdId) => {
        fetch(`http://localhost:5000/api/holds/${holdId}/pickup`, { method: 'POST' })
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
        fetch(`http://localhost:5000/api/holds/${holdId}/cancel`, { method: 'POST' })
            .then(r => { if (!r.ok) throw new Error('Cancel failed'); return r.json(); })
            .then((data) => {
                console.log(data.message); // Log success
                fetchHolds(); // Refresh list
            })
            .catch(err => alert(`Error canceling hold: ${err.message}`));
    };
    // --- END ADDED ---

    // --- REMOVED getThumbnail function ---

    // --- REMOVED old renderHoldActionButtons function ---

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


    return (
        <div>
        <div className="page-container">
            {/* Use existing search result styles? Adapt class names if needed */}
            <div className='search-result-page-container'> 
                <div className="search-result-header">
                    <h1>Manage Holds (Pending Pickups)</h1>
                    <div className="search-result-search-bar-container">
                        {/* --- REMOVED Add Button --- */}
                        {/* TODO: Implement search/filter functionality */}
                        <input type="text" placeholder="Search holds (by user, item...)" className="search-result-search-bar" />
                    </div>
                </div>
                <div className="search-results-contents"> 
                     {/* --- RESTORED Filter section --- */}
                     <div className="filter-section">
                        {holdFilterOptions.map((filterGroup) => (
                            
                            <div key={filterGroup.param} className="filter-category">
                                <h3>{filterGroup.category}</h3>
                                <hr className='divider divider--tight' />
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
                                                <p><small><strong>User:</strong> {hold.firstName} {hold.lastName} ({hold.user_id})</small></p>
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
                                <hr className="divider" />
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