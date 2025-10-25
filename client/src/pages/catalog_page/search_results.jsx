import './search_results.css'
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { FaPlus } from "react-icons/fa"

const filterOptions = [
    { 
        category: 'Item Type', 
        param: 'category', // URL parameter name
        options: ['BOOK', 'MOVIE', 'DEVICE'] 
    },
    { 
        category: 'Genre (Books/Movies)', 
        param: 'genre', // URL parameter name
        options: ['Sci-Fi', 'Fantasy', 'Drama', 'Action', 'Thriller', 'Comedy', 'Animation'] // Add more
    },
    // Add more filter categories like Audience, Language ID, etc.
];

function SearchResults({ isStaff }) {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [localSearchTerm, setLocalSearchTerm] = useState(query);

    const initialFilters = () => {
        const filters = {};
        filterOptions.forEach(group => {
            const paramValue = searchParams.get(group.param);
            if (paramValue) {
                // Assuming multiple values are comma-separated in URL (e.g., genre=Sci-Fi,Fantasy)
                filters[group.param] = paramValue.split(','); 
            } else {
                filters[group.param] = []; // Default to empty array
            }
        });
        return filters;
    };
    const [selectedFilters, setSelectedFilters] = useState(initialFilters);

    useEffect(() => {
        setLoading(true);
        setError('');

        const params = new URLSearchParams();
        if (query) {
            params.set('q', query);
        }
        Object.entries(selectedFilters).forEach(([key, values]) => {
            if (values.length > 0) {
                params.set(key, values.join(','));
            }
        });
        const queryString = params.toString();

        fetch(`http://localhost:5000/api/search?${queryString}`) 
            .then(r => { if (!r.ok) throw new Error('Network response failed'); return r.json(); })
            .then(data => { setResults(data || []); setLoading(false); })
            .catch((err) => { setError(`Could not load results.`); setLoading(false); });

    }, [query, selectedFilters]);


    const handleSearch = (event) => {
        if (event.key === 'Enter') { // Check for Enter key press
            event.preventDefault();
            const currentParams = Object.fromEntries(searchParams.entries());
            const term = localSearchTerm.trim();
            
            if (term) {
                // Update the URL with the new search term
                setSearchParams({ ...currentParams, q: term }); 
            } else {
                // If search term is empty, remove 'q' from URL params
                delete currentParams.q; 
                setSearchParams(currentParams);
            }
        }
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

    const [showAddItemSheet, setShowAddItemSheet] = useState(false);
    const [newItem, setNewItem] = useState({
        title: '',
        description: '',
        thumbnail_url: '',
        shelf_location: '',
        tags: '',
        item_category: 'BOOK', // default
        authors: '',
        publisher: '',
        publication_date: '',
        language: '',
        page_number: '',
        isbn: '',
        directors: '',
        release_year: '',
        runtime: '',
        format: '',
        rating: '',
        manufacturer: '',
        device_type: ''
    });

    function handleItemInputChange(e) {
        const { name, value } = e.target;
        setNewItem(prev => ({ ...prev, [name]: value }));
    }

    function handleAddItemSubmit(e) {
        e.preventDefault();
        console.log("New Item Added:", newItem);
        // send `newItem` to backend or state
        setShowAddItemSheet(false);
    }

    const renderItemDetails = (item) => {
        switch(item.item_category) {
            case "BOOK":
                return (
                    <div className="result-details">
                        <p><strong>Authors:</strong> {item.authors.join(', ')}</p>
                        <p><strong>Publisher:</strong> {item.publisher}</p>
                        <p><strong>Year:</strong> {item.publicationDate}</p>
                        <p><strong>ISBN:</strong> {item.isbn}</p>
                    </div>
                )
            case "MEDIA":
                return (
                    <div className="result-details">
                        <p><strong>Directors:</strong> {item.directors.join(', ')}</p>
                        <p><strong>Format:</strong> {item.format}</p>
                        <p><strong>Rating:</strong> {item.rating}</p>
                        <p><strong>Release Year:</strong> {item.release_year}</p>
                    </div>
                )
            case "DEVICE":
                return (
                    <div className="result-details">
                        <p><strong>Manufacturer:</strong> {item.manufacturer}</p>
                        <p><strong>Software:</strong> {item.software}</p>
                        <p><strong>Device Type:</strong> {item.device_type}</p>
                    </div>
                )
            default:
                return null;
        }
    }

    const renderItemActionButtons = (item) => {
        if(isStaff) return;
        if(item.available > 0) {
            return <button className="action-button primary-button">Borrow</button>;
        } else {
            return <button className="action-button secondary-button">Place Hold</button>;
        }
    }

  return (
    <div>
      <div className="page-container">
        <div className='search-result-page-container'>
            <div className="search-result-header">
                <h1>{query ? `Search Results for "${query}"` : 'Browse Items'}</h1>
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
                     {/* Optional: Add a button that calls handleSearch onClick */}
                    {/* <button onClick={handleSearch}>Search</button> */}
                </div>
            </div>
            <div className="search-results-contents">
            <div className="filter-section">
                {filterOptions.map((filterGroup) => (
                    <div key={filterGroup.param} className="filter-category">
                        <h3>{filterGroup.category}</h3>
                        <hr className='divider divider--tight' />
                        <ul>
                            {filterGroup.options.map((option) => (
                                <li key={option}>
                                    <label>
                                        <input 
                                            type="checkbox" 
                                            value={option}
                                            // Check if option is in the state for this filter param
                                            checked={selectedFilters[filterGroup.param]?.includes(option) || false}
                                            onChange={() => handleFilterChange(filterGroup.param, option)}
                                        /> {option}
                                    </label>
                                </li>
                            ))}
                        </ul>
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
                                    <a href={`/item/${item.id}`} className="result-link">
                                        {item.title}
                                    </a>
                                    </h3>
                                    <div className="result-description">
                                        {/* --- MODIFIED --- Use API data */}
                                        {renderItemDetails(item)}
                                        <div className="availability-status">
                                            <p><small><strong>Available:</strong> <span>{item.available}</span></small></p>
                                            {item.available <= 0 && item.on_hold > 0 && <p><small><strong>On Hold:</strong> <span>{item.on_hold}</span></small></p>}
                                            {item.available <= 0 && (
                                                <p><small><strong>Earliest Available:</strong> <span>{item.earliest_available_date ? new Date(item.earliest_available_date).toLocaleDateString() : 'N/A'}</span></small></p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="result-actions">
                                    {item.available > 0 ? (
                                        <button className="action-button primary-button">Borrow</button>
                                    ) : (
                                        <button className="action-button secondary-button">Place Hold</button>
                                    )}
                                </div>
                            </div>
                            <hr className="divider" />
                            </div>
                        );
                        })}
                </div>
            </div>
        </div>
      </div>
        {showAddItemSheet && (
            <div className="sheet-overlay" onClick={() => setShowAddItemSheet(false)}>
                <div className="sheet-container" onClick={(e) => e.stopPropagation()}>
                <h2>Add New Item</h2>
                <form onSubmit={handleAddItemSubmit}>
                    {/* --- Common fields --- */}
                    <label>
                    Title:
                    <input type="text" name="title" value={newItem.title} onChange={handleItemInputChange} required className="edit-input" />
                    </label>
                    <label>
                    Description:
                    <textarea name="description" value={newItem.description} onChange={handleItemInputChange} required className="edit-input" />
                    </label>
                    <label>
                    Thumbnail URL:
                    <input type="text" name="thumbnail_url" value={newItem.thumbnail_url} onChange={handleItemInputChange} className="edit-input" />
                    </label>
                    <label>
                    Shelf Location:
                    <input type="text" name="shelf_location" value={newItem.shelf_location} onChange={handleItemInputChange} className="edit-input" />
                    </label>
                    <label>
                    Tags:
                    <input type="text" name="tags" value={newItem.tags} onChange={handleItemInputChange} className="edit-input" />
                    </label>

                    {/* --- Item Category --- */}
                    <label>
                    Item Type:
                    <select className="edit-input" name="item_category" value={newItem.item_category} onChange={handleItemInputChange}>
                        <option value="BOOK">Book</option>
                        <option value="MEDIA">Media</option>
                        <option value="DEVICE">Device</option>
                    </select>
                    </label>

                    {/* --- Conditional Fields --- */}
                    {newItem.item_category === 'BOOK' && (
                    <>
                        <label>Authors: <input type="text" name="authors" value={newItem.authors} onChange={handleItemInputChange} className="edit-input" /></label>
                        <label>Publisher: <input type="text" name="publisher" value={newItem.publisher} onChange={handleItemInputChange} className="edit-input" /></label>
                        <label>Published Date: <input type="date" name="publication_date" value={newItem.publication_date} onChange={handleItemInputChange} className="edit-input" /></label>
                        <label>Language: <input type="text" name="language" value={newItem.language} onChange={handleItemInputChange} className="edit-input" /></label>
                        <label>Page Number: <input type="number" name="page_number" value={newItem.page_number} onChange={handleItemInputChange} className="edit-input" /></label>
                        <label>ISBN: <input type="text" name="isbn" value={newItem.isbn} onChange={handleItemInputChange} className="edit-input" /></label>
                    </>
                    )}

                    {newItem.item_category === 'MEDIA' && (
                    <>
                        <label>Directors: <input type="text" name="directors" value={newItem.directors} onChange={handleItemInputChange} className="edit-input" /></label>
                        <label>Release Year: <input type="number" name="release_year" value={newItem.release_year} onChange={handleItemInputChange} className="edit-input" /></label>
                        <label>Runtime (mins): <input type="number" name="runtime" value={newItem.runtime} onChange={handleItemInputChange} className="edit-input" /></label>
                        <label>Language: <input type="text" name="language" value={newItem.language} onChange={handleItemInputChange} className="edit-input" /></label>
                        <label>Format: <input type="text" name="format" value={newItem.format} onChange={handleItemInputChange} className="edit-input" /></label>
                        <label>Rating: <input type="text" name="rating" value={newItem.rating} onChange={handleItemInputChange} className="edit-input" /></label>
                    </>
                    )}

                    {newItem.item_category === 'DEVICE' && (
                    <>
                        <label>Manufacturer: <input type="text" name="manufacturer" value={newItem.manufacturer} onChange={handleItemInputChange} className="edit-input" /></label>
                        <label>Device Type:
                        <select name="device_type" value={newItem.device_type} onChange={handleItemInputChange}>
                            <option value="">Select...</option>
                            <option value="Laptop">Laptop</option>
                            <option value="Tablet">Tablet</option>
                            <option value="Headphones">Headphones</option>
                            <option value="Camera">Camera</option>
                        </select>
                        </label>
                    </>
                    )}

                    {/* --- Actions --- */}
                    <div className="sheet-actions">
                    <button type="submit" className="action-button primary-button">Add Item</button>
                    <button
                        type="button"
                        className="action-button secondary-button"
                        onClick={() => setShowAddItemSheet(false)}
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