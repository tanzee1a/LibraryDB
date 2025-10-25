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

    // --- Add useEffect for fetching ---
    useEffect(() => {
        if (query) {
        setLoading(true);
        setError('');
        fetch(`http://localhost:5000/api/search?q=${encodeURIComponent(query)}`) // Adjust URL if needed
            .then(r => { if (!r.ok) throw new Error('Network response failed'); return r.json(); })
            .then(data => { setResults(data || []); setLoading(false); })
            .catch((err) => { setError(`Could not load results for "${query}".`); setLoading(false); });
        } else {
        setResults([]);
        setLoading(false);
        }
    }, [query]);

    const handleSearch = (event) => {
        if (event.key === 'Enter' && localSearchTerm.trim()) {
            event.preventDefault();
            // Update the URL query parameter, which triggers useEffect
            setSearchParams({ q: localSearchTerm.trim() }); 
        }
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
        if (item.category === "BOOK") {
            return <p><small><strong>Authors:</strong> {item.creators || 'N/A'}</small></p>;
        }
        if (item.category === "MOVIE") {
            return <p><small><strong>Directors:</strong> {item.creators || 'N/A'}</small></p>;
        }
        if (item.category === "DEVICE") {
            return <p><small><strong>Manufacturer:</strong> {item.creators || 'N/A'}</small></p>;
        }
        return null;
    };

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
                {/*filters.map((filter) => (
                    <div key={filter.category} className="filter-category">
                        <h3>{filter.category}</h3>
                        <hr className='divider divider--tight' />
                        <ul>
                            {filter.topics.map((topic) => (
                                <li key={topic.name}>
                                    <strong>{topic.name}</strong>
                                    <ul>
                                        {topic.options.map((option) => (
                                            <li key={option}>
                                                <label>
                                                    <input type="checkbox" /> {option}
                                                </label>
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            ))}
                        </ul>
                    </div>
                    ))*/}
            </div>
                <div className="search-results-list">
                    {/* --- ADDED --- Loading, Error, No Results states */}
                     {loading && <p>Loading results...</p>}
                     {error && <p style={{ color: 'red' }}>{error}</p>}
                     {!loading && !error && results.length === 0 && <p>No results found {query ? `for "${query}"` : ''}.</p>}
                     {/* --- END ADDED --- */}
                    {!loading && !error && results.map((item) => {
                        return (
                        <div key={item.id} className={`search-result-item ${item.category.toLowerCase()}`}>
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
                                     {/* --- TODO: Connect these buttons --- */}
                                    {item.available > 0 ? (
                                        <button className="btn primary">Request Pickup</button>
                                    ) : (
                                        <button className="btn secondary">Place Waitlist Hold</button>
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
                    <input type="text" name="title" value={newItem.title} onChange={handleItemInputChange} required />
                    </label>
                    <label>
                    Description:
                    <textarea name="description" value={newItem.description} onChange={handleItemInputChange} required />
                    </label>
                    <label>
                    Thumbnail URL:
                    <input type="text" name="thumbnail_url" value={newItem.thumbnail_url} onChange={handleItemInputChange} />
                    </label>
                    <label>
                    Shelf Location:
                    <input type="text" name="shelf_location" value={newItem.shelf_location} onChange={handleItemInputChange} />
                    </label>
                    <label>
                    Tags:
                    <input type="text" name="tags" value={newItem.tags} onChange={handleItemInputChange} />
                    </label>

                    {/* --- Item Category --- */}
                    <label>
                    Item Type:
                    <select name="item_category" value={newItem.item_category} onChange={handleItemInputChange}>
                        <option value="BOOK">Book</option>
                        <option value="MEDIA">Media</option>
                        <option value="DEVICE">Device</option>
                    </select>
                    </label>

                    {/* --- Conditional Fields --- */}
                    {newItem.item_category === 'BOOK' && (
                    <>
                        <label>Authors: <input type="text" name="authors" value={newItem.authors} onChange={handleItemInputChange} /></label>
                        <label>Publisher: <input type="text" name="publisher" value={newItem.publisher} onChange={handleItemInputChange} /></label>
                        <label>Published Date: <input type="date" name="publication_date" value={newItem.publication_date} onChange={handleItemInputChange} /></label>
                        <label>Language: <input type="text" name="language" value={newItem.language} onChange={handleItemInputChange} /></label>
                        <label>Page Number: <input type="number" name="page_number" value={newItem.page_number} onChange={handleItemInputChange} /></label>
                        <label>ISBN: <input type="text" name="isbn" value={newItem.isbn} onChange={handleItemInputChange} /></label>
                    </>
                    )}

                    {newItem.item_category === 'MEDIA' && (
                    <>
                        <label>Directors: <input type="text" name="directors" value={newItem.directors} onChange={handleItemInputChange} /></label>
                        <label>Release Year: <input type="number" name="release_year" value={newItem.release_year} onChange={handleItemInputChange} /></label>
                        <label>Runtime (mins): <input type="number" name="runtime" value={newItem.runtime} onChange={handleItemInputChange} /></label>
                        <label>Language: <input type="text" name="language" value={newItem.language} onChange={handleItemInputChange} /></label>
                        <label>Format: <input type="text" name="format" value={newItem.format} onChange={handleItemInputChange} /></label>
                        <label>Rating: <input type="text" name="rating" value={newItem.rating} onChange={handleItemInputChange} /></label>
                    </>
                    )}

                    {newItem.item_category === 'DEVICE' && (
                    <>
                        <label>Manufacturer: <input type="text" name="manufacturer" value={newItem.manufacturer} onChange={handleItemInputChange} /></label>
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