import './search_results.css'
import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom';

import { FaPlus } from "react-icons/fa"
import { BiSort } from "react-icons/bi"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; 

/**
 * Handles "Request Pickup" and "Join Waitlist" actions for a specific item.
 * @param {string} itemId - The ID of the item to action.
 * @param {'request' | 'waitlist'} actionType 
 */

function SearchResults({ isStaff }) {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [localSearchTerm, setLocalSearchTerm] = useState(query);

    const [searchType, setSearchType] = useState(searchParams.get('searchType') || 'Title');

    const [languages, setLanguages] = useState([]);
    const [languagesLoading, setLanguagesLoading] = useState(true);
    const [languagesError, setLanguagesError] = useState('');

    const [movieFormats, setMovieFormats] = useState([]);
    const [formatsLoading, setFormatsLoading] = useState(true);
    const [formatsError, setFormatsError] = useState('');

    const [userProfile, setUserProfile] = useState({ is_suspended: false, total_fines: 0.00 });
    const [userProfileLoading, setUserProfileLoading] = useState(true);

    const [filterOptions, setFilterOptions] = useState([
        // Initialize with the static 'Item Type' filter
        { 
            category: 'Item Type', 
            param: 'category',
            options: ['BOOK', 'MOVIE', 'DEVICE'] 
        }
    ]);

    const [tagsLoading, setTagsLoading] = useState(true);


    // This tracks the ID of the *specific* item being submitted
    const [submittingItemId, setSubmittingItemId] = useState(null); 
    // This will hold any error/success message, and which item it belongs to
    const [actionMessage, setActionMessage] = useState({ type: '', text: '', itemId: null });
    // This keeps track of items successfully requested, so we can hide the buttons
    const [successfulRequestIds, setSuccessfulRequestIds] = useState(new Set());

    // This function now just reads from searchParams
    const initialFilters = () => { //
        const filters = {};
        // We can't use the state-based filterOptions here, so we'll just read all params
        for (const [key, value] of searchParams.entries()) {
            if (key !== 'q') {
                filters[key] = value.split(',');
            }
        }
        return filters;
    };
    const [selectedFilters, setSelectedFilters] = useState(initialFilters);

    useEffect(() => {
        setLoading(true);
        setError('');
        setSelectedFilters(initialFilters());
    
        // 1. Search Results Fetch (Existing Logic)
        const params = new URLSearchParams();
        if (query) {
            params.set('q', query);
        }
        if (searchType) {
            params.set('searchType', searchType);
        }
        const freshFilters = initialFilters();

        Object.entries(freshFilters).forEach(([key, values]) => {
            if (values.length > 0) {
                params.set(key, values.join(','));
            }
        });
        const queryString = params.toString();
    
        fetch(`${API_BASE_URL}/api/search?${queryString}`)
            .then(r => { if (!r.ok) throw new Error('Network response failed'); return r.json(); })
            .then(data => { setResults(data || []); setLoading(false); })
            .catch(() => { setError(`Could not load results.`); setLoading(false); });
    
        // 2. Fetch Languages (Existing Logic)
        const fetchLanguages = async () => {
            // ... (fetch languages logic) ...
            setLanguagesLoading(true);
            setLanguagesError('');
            try {
                const response = await fetch(`${API_BASE_URL}/api/languages`); 
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setLanguages(data); 
            } catch (e) {
                console.error("Failed to fetch languages:", e);
                setLanguagesError("Failed to load languages."); 
            } finally {
                setLanguagesLoading(false); 
            }
        };
        fetchLanguages();
    
        // 3. Fetch Movie Formats (Existing Logic)
        const fetchMovieFormats = async () => {
            // ... (fetch movie formats logic) ...
            setFormatsLoading(true);
            setFormatsError('');
            try {
                const response = await fetch(`${API_BASE_URL}/api/movie-formats`); 
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setMovieFormats(data); 
            } catch (e) {
                console.error("Failed to fetch movie formats:", e);
                setFormatsError("Failed to load formats.");
            } finally {
                setFormatsLoading(false);
            }
        };
        fetchMovieFormats();
    
        // 4. Fetch Tags (Existing Logic)
        const fetchTags = async () => {
            // ... (fetch tags logic) ...
            setTagsLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/api/tags`);
                if (!response.ok) throw new Error('Failed to fetch tags');
                const data = await response.json();
                
                const tagNames = data.map(tag => tag.tag_name).sort((a, b) => a.localeCompare(b));
                
                setFilterOptions(prevOptions => [
                    prevOptions[0], 
                        { 
                            category: 'Tags',
                            param: 'tag',
                            options: tagNames 
                        }
                ]);
            } catch (e) {
                console.error("Failed to fetch tags:", e);
            } finally {
                setTagsLoading(false);
            }
        };
        fetchTags();
    
        // --- 5. ADDED: Fetch User Profile for Suspension Status ---
        const token = localStorage.getItem('authToken');
        if (token && !isStaff) { // Only fetch if logged in and not staff view
            const fetchUserProfile = async () => {
                setUserProfileLoading(true);
                try {
                    const response = await fetch(`${API_BASE_URL}/api/my-profile`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
    
                    if (response.ok) {
                        const data = await response.json();
                        setUserProfile({
                            is_suspended: data.is_suspended,
                            total_fines: parseFloat(data.outstanding_fines) || 0.00,
                            requires_membership: data.requires_membership_fee,
                            membership_status: data.membership_status // 'active', 'expired', 'canceled', etc.
                        });
                    } else {
                        // Token is likely expired or invalid, reset profile status
                        setUserProfile({ is_suspended: false, total_fines: 0.00 });
                    }
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                } finally {
                    setUserProfileLoading(false);
                }
            };
    
            fetchUserProfile();
        } else {
            setUserProfileLoading(false);
        }
    
    }, [searchParams, isStaff]); // Depend on string value of params for rerun on any URL change


    const handleSearch = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const currentParams = Object.fromEntries(searchParams.entries());
            const term = localSearchTerm.trim();
            
            const newParams = { ...currentParams };
            if (term) {
                newParams.q = term;
            } else {
                delete newParams.q;
            }
            // Always set searchType
            newParams.searchType = searchType; 
            
            setSearchParams(newParams);
        }

    };

    const handleSortChange = (sortType) => {
        console.log("Sort by:", sortType);
        // Example: apply sorting logic to results
        let sorted = [...results];
        if (sortType === "title_asc") sorted.sort((a, b) => a.title.localeCompare(b.title));
        if (sortType === "title_desc") sorted.sort((a, b) => b.title.localeCompare(a.title));
        if (sortType === "newest") sorted.sort((a, b) => (b.release_year || 0) - (a.release_year || 0));
        if (sortType === "oldest") sorted.sort((a, b) => (a.release_year || 0) - (b.release_year || 0));
        setResults(sorted);
    };

    const handleFilterChange = (param, option) => {
        setSelectedFilters(prevFilters => {
            const currentValues = prevFilters[param] || [];
            let newValues;
            if (currentValues.includes(option)) {
                // Remove option if already selected
                newValues = currentValues.filter(val => val !== option);
            } else {
                // Add option if not selected
                newValues = [...currentValues, option];
            }
            // Update URL immediately when filter changes
            const currentParams = Object.fromEntries(searchParams.entries());
            const newSearchParams = { ...currentParams, [param]: newValues.join(',') };
            // Remove param if empty
            if (newValues.length === 0) {
                 delete newSearchParams[param];
            }
            setSearchParams(newSearchParams, { replace: true }); // Use replace to avoid browser history clutter

            return { ...prevFilters, [param]: newValues };
        });
    };

    const handleLoanAction = async (itemId, actionType) => {
        // Prevent multiple requests at the same time
        if (submittingItemId) return; 

        // --- Authentication ---
        const token = localStorage.getItem('authToken'); 
        if (!token) {
            // Set the message for this specific item
            setActionMessage({ type: 'error', text: 'You must be logged in.', itemId: itemId });
            return;
        }
        // ------------------------

        setSubmittingItemId(itemId); // Set *this* item as 'submitting'
        setActionMessage({ type: '', text: '', itemId: null }); // Clear old messages

        const endpoint = actionType === 'request'
        ? `/api/request/${itemId}`
        : `/api/waitlist/${itemId}`;
        
        try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
            'Authorization': `Bearer ${token}`, 
            'Content-Type': 'application/json'
            },
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'An error occurred.'); 
        }

        // Success!
        setActionMessage({
            type: 'success',
            text: actionType === 'request' ? 'Pickup requested!' : 'Added to waitlist!',
            itemId: itemId // Tie the success message to this item
        });
        
        // Add this item's ID to the set of successful requests
        setSuccessfulRequestIds(prevIds => new Set(prevIds).add(itemId));

        } catch (err) {
        // Tie the error message to this item
        setActionMessage({ type: 'error', text: err.message, itemId: itemId });
        } finally {
        setSubmittingItemId(null); // Clear 'submitting' status
        }
    };

    const [showAddItemSheet, setShowAddItemSheet] = useState(false);
    const initialNewItemState = {
        item_id: '',
        title: '',
        description: '',
        thumbnail_url: '',
        shelf_location: '',
        tags: '',
        category: 'BOOK',
        authors: '',
        publisher: '',
        published_date: '',
        language_id: '1',
        page_number: '',
        directors: '',
        release_year: '',
        runtime: '',
        format_id: '1',
        rating_id: '1',
        manufacturer: '',
        device_type: '1',
        quantity: '1'
    };
    const [newItem, setNewItem] = useState(initialNewItemState);
    const [isSubmitting, setIsSubmitting] = useState(false); // For loading state on submit
    const [submitError, setSubmitError] = useState('');

    function handleItemInputChange(e) {
        const { name, value } = e.target;
        setNewItem(prev => ({ ...prev, [name]: value }));
    }

    async function handleAddItemSubmit(e) {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError('');

        const token = localStorage.getItem('authToken');
        if (!token) {
            setSubmitError('Authentication required. Please log in.');
            setIsSubmitting(false);
            // This is what likely generated your "Error: Not authorized, no token" log
            return; 
        }

        // 1. Determine Endpoint and Prepare Base Data
        let endpoint = '';
        const commonData = {
            item_id: newItem.item_id,
            title: newItem.title,
            description: newItem.description,
            thumbnail_url: newItem.thumbnail_url || null, // Allow empty URL
            shelf_location: newItem.shelf_location || null,
            quantity: parseInt(newItem.quantity, 10) || 0, // Ensure it's a number
            tags: newItem.tags ? newItem.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [], // Split tags into array
        };

        let specificData = {};

        // 2. Prepare Category-Specific Data and Endpoint
        if (newItem.category === 'BOOK') {
            endpoint = '/api/items/book';
            specificData = {
                // isbn_13: newItem.isbn, // Removed
                publisher: newItem.publisher,
                published_date: newItem.published_date,
                language_id: parseInt(newItem.language_id, 10) || 1, // Use selected/default ID
                page_number: parseInt(newItem.page_number, 10) || 0,
                authors: newItem.authors ? newItem.authors.split(',').map(a => a.trim()).filter(Boolean) : [], // Split authors
            };
        } else if (newItem.category === 'MOVIE') { // Changed from MEDIA
            endpoint = '/api/items/movie';
             // --- TODO: Generate or get a unique movie_id (like UPC) if needed by backend ---
            // Let's assume item_id is sufficient for now based on previous discussion
            specificData = {
                // movie_id: `MOV-${uuidv4().substring(0, 8)}`, // Example if needed
                language_id: parseInt(newItem.language_id, 10) || 1,
                format_id: parseInt(newItem.format_id, 10) || 1, // Use selected/default ID
                runtime: parseInt(newItem.runtime, 10) || 0,
                rating_id: parseInt(newItem.rating_id, 10) || 1, // Use selected/default ID
                release_year: parseInt(newItem.release_year, 10) || null,
                directors: newItem.directors ? newItem.directors.split(',').map(d => d.trim()).filter(Boolean) : [], // Split directors
            };
        } else if (newItem.category === 'DEVICE') {
            endpoint = '/api/items/device';
            specificData = {
                manufacturer: newItem.manufacturer,
                device_name: newItem.title, // Use title as device_name based on schema
                device_type: parseInt(newItem.device_type, 10) || 1, // Use selected/default ID
            };
             // Device doesn't have its own title field, reuse commonData.title
             delete specificData.title; 
             // Device model uses device_name
             specificData.device_name = commonData.title;
        } else {
             setSubmitError('Invalid item category selected.');
             setIsSubmitting(false);
             return; // Stop if category is wrong
        }

        // 3. Combine Data and Make API Call
        const payload = { ...commonData, ...specificData };
        console.log("Submitting:", endpoint, payload); // For debugging

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error ${response.status}`);
            }

            // Success!
            console.log("Item Added:", await response.json());
            setShowAddItemSheet(false);     // Close sheet
            setNewItem(initialNewItemState); // Reset form
            // Optionally: Refresh search results list here if needed
            // fetchSearchResults(); // You'd need to extract fetch logic into a reusable function

        } catch (err) {
            console.error("Add Item Error:", err);
            setSubmitError(`Failed to add item: ${err.message}`);
        } finally {
            setIsSubmitting(false); // Re-enable button
        }
    }

    const renderItemDetails = (item) => {
        switch(item.category) {
            case "BOOK":
                return (
                    <div className='result-details'>
                        <p><strong>Category:</strong> {item.category || 'N/A'}</p>
                        <p><strong>Authors:</strong> {item.creators || 'N/A'}</p>
                        <p><strong>Publisher:</strong> {item.publisher || 'N/A'}</p>
                        <p><strong>Language:</strong> {item.language_name || 'N/A'}</p>
                    </div>
                );
            case "MOVIE":
                return (
                    <div className='result-details'>
                        <p><strong>Category:</strong> {item.category || 'N/A'}</p>
                        <p><strong>Directors:</strong> {item.creators || 'N/A'}</p>
                        <p><strong>Format:</strong> {item.format_name || 'N/A'}</p>
                        <p><strong>Release Year:</strong> {item.release_year || 'N/A'}</p>
                    </div>
                );
            case "DEVICE":
                return (
                    <div className='result-details'>
                        <p><strong>Category:</strong> {item.category || 'N/A'}</p>
                        <p><strong>Manufacturer:</strong> {item.creators || 'N/A'}</p>
                        <p><strong>Device Type:</strong> {item.device_type_name || 'N/A'}</p>
                    </div>
                );
        }
        return null;
    };

    const renderItemActionButtons = (item) => {
        if(isStaff) return;

        // 1. Suspension Check
        if (userProfileLoading) {
             return <button className="action-button primary-button" disabled>Loading Status...</button>
        }

        const isSuspended = userProfile.is_suspended;
        const membershipExpired = userProfile.requires_membership && userProfile.membership_status !== 'active';
        const isDenied = isSuspended || membershipExpired;
        
        if (isDenied) {
            let denialMessage = 'Account Suspended';
            let subMessage = '';
    
            if (isSuspended) {
                denialMessage = 'Account Suspended (Fines)';
                subMessage = `Fines exceed $${Number(userProfile.total_fines || 0).toFixed(2)}.`;
            } else if (membershipExpired) {
                denialMessage = 'Membership Required';
                subMessage = `Your membership is currently not active.`;
            }
    
            return (
                <div className="search-item-actions">
                    <button className="action-button primary-button disabled-button" disabled>
                        {denialMessage}
                    </button>
                    <p className="action-message error">
                        {subMessage}
                    </p>
                </div>
            );
        }

        // 2. If this item's ID is in our 'successful' set, show a message instead of buttons
        if (successfulRequestIds.has(item.item_id)) { 
            return <span className="action-message success">Request made!</span>;
        }

        // 3. Is this *specific* item the one currently being submitted?
        const isSubmitting = submittingItemId === item.item_id;

        return (
            <div className="search-item-actions">
                {item.available > 0 ? (
                    <button 
                        className="action-button primary-button"
                        onClick={() => handleLoanAction(item.item_id, 'request')}
                        // Disable if submitting, OR if suspended (though checked above, good for safety)
                        disabled={isSubmitting || submittingItemId !== null || userProfile.is_suspended} 
                    >
                        {isSubmitting ? 'Requesting...' : 'Request Pickup'}
                    </button>
                ) : (
                    <button 
                        className="action-button secondary-button"
                        onClick={() => handleLoanAction(item.item_id, 'waitlist')}
                        // Disable if submitting, OR if suspended (though checked above, good for safety)
                        disabled={isSubmitting || submittingItemId !== null || userProfile.is_suspended} 
                    >
                        {isSubmitting ? 'Joining...' : 'Join Waitlist'}
                    </button>
                )}

                {/* 4. Display an error/success message only if it belongs to *this* item */}
                {actionMessage.itemId === item.item_id && (
                    <p className={`action-message ${actionMessage.type}`}>
                        {actionMessage.text}
                    </p>
                )}
            </div>
        );
    }

  return (
    <div>
      <div className="page-container">
        <div className='search-result-page-container'>
            <div className="search-result-header">
                <h1>{ isStaff ? 'Manage Items' : 'Find your perfect discovery.'}</h1>
                <p>{query ? `Search Results for "${query}". Found ${results.length} item(s).` : ''}</p>
                <div className="search-result-search-bar-container">
                    { isStaff && (
                        <button
                            className="action-circle-button primary-button"
                            onClick={() => setShowAddItemSheet(true)}
                        >
                            <FaPlus />
                        </button>
                    )}
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        className="search-result-search-bar" 
                        value={localSearchTerm}
                        onChange={(e) => setLocalSearchTerm(e.target.value)}
                        onKeyDown={handleSearch}
                    />
                    
                    <select 
                        className="search-type-dropdown" 
                        value={searchType} 
                        onChange={(e) => setSearchType(e.target.value)}
                    >
                        <option value="Title">Title</option>
                        <option value="Description">By All</option>
                        <option value="Manufacturer">Manufacturer</option>
                        <option value="Author">Author</option>
                        <option value="Director">Director</option>
                        <option value="Tag">Tag</option>
                        {/* <option value="User">User</option> -- Only if you implement user search */}
                    </select>

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
                        </select>
                    </div>
                    {filterOptions.map((filterGroup) => (
                        <div key={filterGroup.param} className="filter-category">
                            <h3>{filterGroup.category}</h3>
                            <hr className='thin-divider divider--tight' />
                            {/* Add loading check for tags */}
                            {filterGroup.param === 'tag' && tagsLoading ? (
                                <p>Loading tags...</p>
                            ) : (
                            <ul>
                                {filterGroup.options.map((option) => (
                                    <li key={option}>
                                        <label>
                                            <input 
                                                type="checkbox" 
                                                value={option}
                                                checked={selectedFilters[filterGroup.param]?.includes(option) || false}
                                                onChange={() => handleFilterChange(filterGroup.param, option)}
                                            /> {option}
                                        </label>
                                    </li>
                                ))}
                            </ul>
                            )}
                        </div>
                    ))}
                </div>
                <div className="search-results-list">
                    {/* --- ADDED --- Loading, Error, No Results states */}
                     {loading && <p>Loading results...</p>}
                     {error && <p style={{ color: 'red' }}>{error}</p>}
                     {!loading && !error && results.length === 0 && <p>No results found {query ? `for "${query}"` : ''}.</p>}
                     {/* --- END ADDED --- */}
                    {!loading && !error && results.map((item) => {
                        return (
                        <div key={item.item_id} className={`search-result-item ${item.category.toLowerCase()}`}>
                            <div className="result-info">
                                <div>
                                    {/* --- MODIFIED --- Use thumbnail_url from API */}
                                    <img 
                                        src={item.thumbnail_url || '/placeholder-image.png'} 
                                        alt={item.title} 
                                        className="result-thumbnail" 
                                        onError={(e) => { e.target.onerror = null; e.target.src='/placeholder-image.png'; }}
                                    />
                                </div>
                                <div className='result-text-info'>
                                    <h3 className="result-title">
                                     {/* --- MODIFIED --- Use Link component */}
                                    <Link to={`/item/${item.item_id}`} className="result-link">
                                        {item.title} 
                                    </Link>
                                    </h3>
                                    <div className="result-description">
                                        <div className='result-details'>
                                            {renderItemDetails(item)}
                                        </div>
                                        <div className="availability-status">
                                            <p><strong>Available:</strong> <span>{item.available}</span></p>
                                            {item.available <= 0 && item.on_hold > 0 && <p><strong>On Hold:</strong> <span>{item.on_hold}</span></p>}
                                            {item.available <= 0 && (
                                                <p><strong>Earliest Available:</strong> <span>{item.earliest_available_date ? new Date(item.earliest_available_date).toLocaleDateString() : 'N/A'}</span></p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="result-actions">
                                    {renderItemActionButtons(item)}
                                </div>
                            </div>
                            <hr className="thin-divider" />
                            </div>
                        );
                        })}
                </div>
            </div>
        </div>
      </div>
        {showAddItemSheet && (
            <div className="sheet-overlay" onClick={() => !isSubmitting && setShowAddItemSheet(false)}> 
                <div className="sheet-container" onClick={(e) => e.stopPropagation()}>
                <h2>Add New Item</h2>
                {/* Display submission error */}
                {submitError && <p style={{color: 'red'}}>{submitError}</p>}
                
                <form onSubmit={handleAddItemSubmit}>
                    {/* --- Common fields --- */}
                    <label>
                    Item ID (13 chars): {/* Add this label and input */}
                    <input 
                        type="text" 
                        name="item_id" 
                        value={newItem.item_id} 
                        onChange={handleItemInputChange} 
                        required 
                        maxLength="13" // Enforce 13 characters
                        minLength="13" // Enforce 13 characters
                        className="edit-input" 
                    />
                    </label>
                    <label> Title: <input type="text" name="title" value={newItem.title} onChange={handleItemInputChange} required className="edit-input" /></label>
                    <label> Category:
                        {/* --- MODIFIED: Use category, not item_category --- */}
                        <select className="edit-input" name="category" value={newItem.category} onChange={handleItemInputChange}>
                            <option value="BOOK">Book</option>
                            <option value="MOVIE">Movie</option> {/* Changed from MEDIA */}
                            <option value="DEVICE">Device</option>
                        </select>
                    </label>
                    <label> Description: <textarea name="description" value={newItem.description} onChange={handleItemInputChange} className="edit-input" /></label>
                    <label> Thumbnail URL: <input type="url" name="thumbnail_url" value={newItem.thumbnail_url} onChange={handleItemInputChange} className="edit-input" /></label>
                    <label> Shelf Location: <input type="text" name="shelf_location" value={newItem.shelf_location} onChange={handleItemInputChange} className="edit-input" /></label>
                    <label> Quantity: <input type="number" name="quantity" min="0" value={newItem.quantity} onChange={handleItemInputChange} required className="edit-input" /></label>
                    <label> Tags (comma-separated): <input type="text" name="tags" value={newItem.tags} onChange={handleItemInputChange} className="edit-input" /></label>

                    {/* --- Conditional Fields --- */}
                    {newItem.category === 'BOOK' && (
                    <>
                        {/* <label>ISBN: <input type="text" name="isbn" value={newItem.isbn} onChange={handleItemInputChange} className="edit-input" /></label> */}
                        <label>Authors (comma-separated): <input type="text" name="authors" value={newItem.authors} onChange={handleItemInputChange} className="edit-input" /></label>
                        <label>Publisher: <input type="text" name="publisher" value={newItem.publisher} onChange={handleItemInputChange} className="edit-input" /></label>
                        <label>Published Date: <input type="date" name="published_date" value={newItem.published_date} onChange={handleItemInputChange} className="edit-input" required/></label>
                        <label>Language: 
                                <select 
                                    name="language_id" 
                                    value={newItem.language_id} 
                                    onChange={handleItemInputChange} 
                                    className="edit-input"
                                    disabled={languagesLoading || languagesError}
                                >
                                    <option value="" disabled>
                                        {languagesLoading ? 'Loading...' : languagesError ? 'Error' : '-- Select --'}
                                    </option>
                                    {!languagesLoading && !languagesError && languages.map(lang => (
                                        <option key={lang.language_id} value={lang.language_id}>
                                            {lang.name}
                                        </option>
                                    ))}
                                </select>
                                {languagesError && <span style={{ color: 'red', fontSize: '0.8em' }}> {languagesError}</span>}
                            </label>
                        <label>Page Number: <input type="number" name="page_number" min="1" value={newItem.page_number} onChange={handleItemInputChange} className="edit-input" required/></label>
                    </>
                    )}

                    {newItem.category === 'MOVIE' && ( // Changed from MEDIA
                    <>
                        <label>Directors (comma-separated): <input type="text" name="directors" value={newItem.directors} onChange={handleItemInputChange} className="edit-input" /></label>
                        <label>Release Year: <input type="number" name="release_year" min="1800" max={new Date().getFullYear()+1} value={newItem.release_year} onChange={handleItemInputChange} className="edit-input" required/></label>
                        <label>Runtime (mins): <input type="number" name="runtime" min="1" value={newItem.runtime} onChange={handleItemInputChange} className="edit-input" required/></label>
                        <label>Language: 
                            <select 
                                name="language_id" 
                                value={newItem.language_id} 
                                onChange={handleItemInputChange} 
                                className="edit-input"
                                disabled={languagesLoading || languagesError}
                            >
                                    <option value="" disabled>
                                    {languagesLoading ? 'Loading...' : languagesError ? 'Error' : '-- Select --'}
                                </option>
                                {!languagesLoading && !languagesError && languages.map(lang => (
                                    <option key={lang.language_id} value={lang.language_id}>
                                        {lang.name}
                                    </option>
                                ))}
                            </select>
                            {languagesError && <span style={{ color: 'red', fontSize: '0.8em' }}> {languagesError}</span>}
                        </label>
                        <label>Format:
                            <select
                                name="format_id"
                                value={newItem.format_id}
                                onChange={handleItemInputChange}
                                className="edit-input"
                                disabled={formatsLoading || formatsError}
                            >
                                <option value="" disabled>
                                    {formatsLoading ? 'Loading...' : formatsError ? 'Error' : '-- Select --'}
                                </option>
                                {!formatsLoading && !formatsError && movieFormats.map(format => (
                                    <option key={format.format_id} value={format.format_id}>
                                        {format.format_name}
                                    </option>
                                ))}
                            </select>
                                {formatsError && <span style={{ color: 'red', fontSize: '0.8em' }}> {formatsError}</span>}
                        </label>
                        <label>Rating ID: 
                             <select name="rating_id" value={newItem.rating_id} onChange={handleItemInputChange} className="edit-input">
                                <option value="1">G</option> 
                                <option value="2">PG</option>
                                <option value="3">PG-13</option>
                                <option value="4">R</option>
                                {/* TODO: Fetch ratings dynamically */}
                            </select>
                        </label>
                    </>
                    )}

                    {newItem.category === 'DEVICE' && (
                    <>
                        <label>Manufacturer: <input type="text" name="manufacturer" value={newItem.manufacturer} onChange={handleItemInputChange} className="edit-input" /></label>
                        <label>Device Type ID:
                         {/* --- MODIFIED: Use device_type ID --- */}
                        <select name="device_type" value={newItem.device_type} onChange={handleItemInputChange} className="edit-input" required>
                            <option value="1">Laptops</option>
                            <option value="2">Tablets</option>
                            <option value="3">Cameras</option>
                            <option value="4">Headphones</option>
                             {/* TODO: Fetch device types dynamically */}
                        </select>
                        </label>
                    </>
                    )}

                    {/* --- Actions --- */}
                    <div className="sheet-actions">
                    {/* Disable button while submitting */}
                    <button type="submit" className="action-button primary-button" disabled={isSubmitting}>
                         {isSubmitting ? 'Adding...' : 'Add Item'}
                    </button>
                    <button
                        type="button"
                        className="action-button secondary-button"
                        onClick={() => setShowAddItemSheet(false)}
                        disabled={isSubmitting} // Disable cancel too
                    >
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

export default SearchResults