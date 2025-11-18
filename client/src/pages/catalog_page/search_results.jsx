import './search_results.css'
import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify'; 
import { FaPlus } from "react-icons/fa"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; 

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

    const [tagsLoading, setTagsLoading] = useState(true);
    const [showAllTags, setShowAllTags] = useState(false);


    const [userProfile, setUserProfile] = useState({ 
        is_suspended: false, 
        total_fines: 0.00,
        requires_membership: false,
        membership_status: null,
        expires_at: null
    });
    const [userProfileLoading, setUserProfileLoading] = useState(true);

    const baseFilterOptions = [
        { 
            category: 'Item Type', 
            param: 'category',
            options: ['BOOK', 'MOVIE', 'DEVICE'] 
        },
        // Staff Only Filter
        {
            category: 'Item Status', 
            param: 'status', 
            options: ['ACTIVE', 'DELETED'] 
        }
    ];
    const [filterOptions, setFilterOptions] = useState(baseFilterOptions);
    

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

        if (isStaff) {
            params.set('view', 'staff');
        }

        const queryString = params.toString();
    
        fetch(`${API_BASE_URL}/api/search?${queryString}`)
            .then(r => { if (!r.ok) throw new Error('Network response failed'); return r.json(); })
            .then(data => { setResults(data || []); setLoading(false); })
            .catch(() => { setError(`Could not load results.`); setLoading(false); });
    
        // 2. Fetch Languages 
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

        const fetchDynamicFilters = async () => {
            setTagsLoading(true);
            setFormatsLoading(true); // Use loading state for formats
            try {
                // Fetch tags and formats in parallel
                const [tagsResponse, formatsResponse] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/tags`),
                    fetch(`${API_BASE_URL}/api/movie-formats`)
                ]);
        
                if (!tagsResponse.ok) throw new Error('Failed to fetch tags');
                if (!formatsResponse.ok) throw new Error('Failed to fetch movie formats');
        
                const tagsData = await tagsResponse.json();
                const formatsData = await formatsResponse.json();
                
                // Set movieFormats for the "Add Item" form
                setMovieFormats(formatsData); 

                // Process data for filters
                const tagNames = tagsData.map(tag => tag.tag_name);
                const formatNames = formatsData.map(format => format.format_name).sort();
                
                // Set all filters at once, building from the base
                setFilterOptions([
                    ...baseFilterOptions, // Add the static 'Item Type' and 'Item Status'
                    { // Add dynamic 'Tags'
                        category: 'Tags',
                        param: 'tag',
                        options: tagNames 
                    },
                    { // Add dynamic 'Movie Formats'
                        category: 'Movie Formats',
                        param: 'format', // This param is used in your searchModel
                        options: formatNames
                    }
                ]);

            } catch (e) {
                console.error("Failed to fetch dynamic filters:", e);
                // You could set a general filterError state here
            } finally {
                setTagsLoading(false);
                setFormatsLoading(false);
            }
        };

        fetchDynamicFilters(); // Call the combined fetch function

    
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
                            membership_status: data.membership_status,
                            expires_at: data.expires_at
                        });
                    } else {
                        // Token is likely expired or invalid, reset profile status
                        setUserProfile({ 
                            is_suspended: false, 
                            total_fines: 0.00,
                            requires_membership: false,
                            membership_status: null,
                            expires_at: null
                        });
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
    const [newItemFile, setNewItemFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false); // For loading state on submit
    const [submitError, setSubmitError] = useState('');


    function handleItemInputChange(e) {
        const { name, value } = e.target;
        setNewItem(prev => ({ ...prev, [name]: value }));
    }

    function handleItemFileChange(e) {
        if (e.target.files.length > 0) {
            setNewItemFile(e.target.files[0]);
            // Optional: Clear any manually pasted URL
            setNewItem(prev => ({ ...prev, thumbnail_url: '' }));
        } else {
            setNewItemFile(null);
        }
    }

    async function handleAddItemSubmit(e) {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError('');

        const token = localStorage.getItem('authToken');
        if (!token) {
            setSubmitError('Authentication required. Please log in.');
            setIsSubmitting(false);
            return; 
        }

        const formData = new FormData();

        formData.append('item_id', newItem.item_id);
        formData.append('title', newItem.title);
        formData.append('description', newItem.description);
        formData.append('shelf_location', newItem.shelf_location);
        formData.append('quantity', newItem.quantity);
        formData.append('tags', newItem.tags); // Send as string, controller will split
        formData.append('category', newItem.category);

            // 3. Append the file (if it exists)
        if (newItemFile) {
            // 'thumbnailImage' MUST match the name your controller expects
            formData.append('thumbnailImage', newItemFile, newItemFile.name);
        } else {
            // No file, just send the manually pasted URL (if any)
            formData.append('thumbnail_url', newItem.thumbnail_url);
        }


        let endpoint = '';
        if (newItem.category === 'BOOK') {
            endpoint = '/api/items/book';
            formData.append('publisher', newItem.publisher);
            formData.append('published_date', newItem.published_date);
            formData.append('language_id', newItem.language_id);
            formData.append('page_number', newItem.page_number);
            formData.append('authors', newItem.authors); // Send as string
        } else if (newItem.category === 'MOVIE') { 
        endpoint = '/api/items/movie';
        
        // --- ADD THESE ---
        formData.append('directors', newItem.directors);
        formData.append('release_year', newItem.release_year);
        formData.append('runtime', newItem.runtime);
        formData.append('language_id', newItem.language_id);
        formData.append('format_id', newItem.format_id);
        formData.append('rating_id', newItem.rating_id);
        // -----------------

    } else if (newItem.category === 'DEVICE') {
        endpoint = '/api/items/device';
        
        // --- ADD THESE ---
        formData.append('manufacturer', newItem.manufacturer);
        formData.append('device_type', newItem.device_type);
        // -----------------
    
    } else {
         setSubmitError('Invalid item category selected.');
         setIsSubmitting(false);
         return;
    }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}` 
                },
                body: formData
            });

            if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error ${response.status}`);
        }

        const data = await response.json();
        console.log("Item Added:", data);
        toast.success(`Item ${newItem.title} added successfully!`);
        setShowAddItemSheet(false);     
        setNewItem(initialNewItemState);
        setNewItemFile(null); // <-- Reset the file state

    } catch (err) {
        console.error("Add Item Error:", err);
        setSubmitError(`Failed to add item: ${err.message}`);
    } finally {
        setIsSubmitting(false); 
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
        const membershipExpired = userProfile.requires_membership && (new Date(userProfile.expires_at) < new Date());
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
                        disabled={isSubmitting || submittingItemId !== null || userProfile.is_suspended} 
                    >
                        {isSubmitting ? 'Requesting...' : 'Request Pickup'}
                    </button>
                ) : (
                    <button 
                        className="action-button secondary-button"
                        onClick={() => handleLoanAction(item.item_id, 'waitlist')}
                        disabled={isSubmitting || submittingItemId !== null || userProfile.is_suspended} 
                    >
                        {isSubmitting ? 'Joining...' : 'Join Waitlist'}
                    </button>
                )}

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
                <p>{query ? `Search Results for "${query}". Found ${results.length} item(s).` : 'All roads lead to here.'}</p>
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
                            <option value="title_asc">Title (A–Z)</option>
                            <option value="title_desc">Title (Z–A)</option>
                        </select>
                    </div>
                    {filterOptions.map((filterGroup) => (
                        // Only show the 'status' filter if isStaff is true
                        (filterGroup.param !== 'status' || isStaff) && (
                            <div key={filterGroup.param} className="filter-category">
                                <h3>{filterGroup.category}</h3>
                                <hr className='thin-divider divider--tight' />
                                {/* 1. Show loading message ONLY for the specific loading filter */}
                                {filterGroup.param === 'tag' && tagsLoading && (
                                    <p>Loading tags...</p>
                                )}
                                {filterGroup.param === 'format' && formatsLoading && (
                                    <p>Loading formats...</p>
                                )}
                                {/* 2. Render the list (if not loading) */}
                                {!(filterGroup.param === 'tag' && tagsLoading) && !(filterGroup.param === 'format' && formatsLoading) && (
                                    <ul>
                                        {/* 3. Slice the list ONLY if it's the tag filter and showAllTags is false */}
                                        {
                                          (filterGroup.param === 'tag' && !showAllTags 
                                            ? filterGroup.options.slice(0, 10) 
                                            : filterGroup.options
                                          ).map((option) => (
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
                                          ))
                                        }
                                    </ul>
                                )}
                                {/* 4. Render "See More"/"See Less" buttons ONLY for the tag filter */}
                                {filterGroup.param === 'tag' && !tagsLoading && (
                                    <>
                                        {!showAllTags && filterGroup.options.length > 10 && (
                                            <button 
                                                className="see-more-button"
                                                onClick={() => setShowAllTags(true)}
                                                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', padding: '5px 0', fontSize: '0.9em', width: '100%', textAlign: 'left' }}
                                            >
                                                See More ({filterGroup.options.length - 10} more)
                                            </button>
                                        )}
                                        {showAllTags && (
                                            <button 
                                                className="see-more-button"
                                                onClick={() => setShowAllTags(false)}
                                                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', padding: '5px 0', fontSize: '0.9em', width: '100%', textAlign: 'left' }}
                                            >
                                                See Less
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        ) 
                    ))}
                </div>
                <div className="search-results-list">
                     {loading && <p>Loading results...</p>}
                     {error && <p style={{ color: 'red' }}>{error}</p>}
                     {!loading && !error && results.length === 0 && <p>No results found {query ? `for "${query}"` : ''}.</p>}
                    {!loading && !error && results.map((item) => {
                        return (
                        <div key={item.item_id} className={`search-result-item ${item.category.toLowerCase()} ${isStaff && item.status === 'DELETED' ? 'deleted-item' : ''}`}>
                            <div className="result-info">
                                <div>
                                    <img 
                                        src={item.thumbnail_url || '/placeholder-image.png'} 
                                        alt={item.title} 
                                        className="result-thumbnail" 
                                        onError={(e) => { e.target.onerror = null; e.target.src='/placeholder-image.png'; }}
                                    />
                                </div>
                                <div className='result-text-info'>
                                    <h3 className="result-title">
                                    <Link to={`/item/${item.item_id}`} className="result-link">
                                        {item.title} 
                                    </Link>
                                    {isStaff && item.status === 'DELETED' && (
                                        <span className="status-tag deleted-tag">DELETED</span>
                                    )}
                                    </h3>
                                    
                                    <div className="result-description">
                                        <div className='result-details'>
                                            {isStaff && (
                                                <p className="result-item-id">
                                                    <strong>Item ID:</strong> {item.item_id}
                                                </p>
                                            )}
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
                {submitError && <p style={{color: 'red'}}>{submitError}</p>}
                
                <form onSubmit={handleAddItemSubmit}>
                    <label>
                    Item ID (13 chars): 
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
                        <select className="edit-input" name="category" value={newItem.category} onChange={handleItemInputChange}>
                            <option value="BOOK">Book</option>
                            <option value="MOVIE">Movie</option> 
                            <option value="DEVICE">Device</option>
                        </select>
                    </label>
                    <label> Description: <textarea name="description" value={newItem.description} onChange={handleItemInputChange} className="edit-input" /></label>
                    <label> Thumbnail URL (Manual Paste): 
                        <input 
                            type="url" 
                            name="thumbnail_url" 
                            value={newItem.thumbnail_url} 
                            onChange={handleItemInputChange} 
                            className="edit-input" 
                            disabled={!!newItemFile}
                        />
                    </label>
                    <label> Or Upload Image:
                        <input 
                            type="file" 
                            name="thumbnailImage"
                            onChange={handleItemFileChange}
                            accept="image/png, image/jpeg"
                            className="edit-input" 
                        />
                    </label>
                    <label> Shelf Location: <input type="text" name="shelf_location" value={newItem.shelf_location} onChange={handleItemInputChange} className="edit-input" /></label>
                    <label> Quantity: <input type="number" name="quantity" min="0" value={newItem.quantity} onChange={handleItemInputChange} required className="edit-input" /></label>
                    <label> Tags (comma-separated): <input type="text" name="tags" value={newItem.tags} onChange={handleItemInputChange} className="edit-input" /></label>

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

                    {newItem.category === 'MOVIE' && ( 
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
                            </select>
                        </label>
                    </>
                    )}

                    {newItem.category === 'DEVICE' && (
                    <>
                        <label>Manufacturer: <input type="text" name="manufacturer" value={newItem.manufacturer} onChange={handleItemInputChange} className="edit-input" /></label>
                        <label>Device Type ID:
                        <select name="device_type" value={newItem.device_type} onChange={handleItemInputChange} className="edit-input" required>
                            <option value="1">Laptops</option>
                            <option value="2">Tablets</option>
                            <option value="3">Cameras</option>
                            <option value="4">Headphones</option>
                        </select>
                        </label>
                    </>
                    )}

                    {/* --- Actions --- */}
                    <div className="sheet-actions">
                    <button type="submit" className="action-button primary-button" disabled={isSubmitting}>
                         {isSubmitting ? 'Adding...' : 'Add Item'}
                    </button>
                    <button
                        type="button"
                        className="action-button secondary-button"
                        onClick={() => setShowAddItemSheet(false)}
                        disabled={isSubmitting} 
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