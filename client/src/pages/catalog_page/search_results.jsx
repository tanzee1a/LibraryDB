import './search_results.css'
import bookThumbnail from '../../assets/book_thumbnail.jpeg'
import mediaThumbnail from '../../assets/media_thumbnail.jpg'
import deviceThumbnail from '../../assets/device_thumbnail.jpeg'
import sampleData from '../../assets/sample_data.json'
import { useState } from 'react'

import { FaPlus } from "react-icons/fa"

function SearchResults({ isStaff }) {
    const filters = sampleData.item_filters;

    const mockResults = sampleData.items.map(item => ({
    ...item,
    thumbnail:
        item.category === "BOOK"
        ? bookThumbnail
        : item.category === "MEDIA"
        ? mediaThumbnail
        : deviceThumbnail,
    }));

    const multipleMockResults = [...mockResults, ...mockResults, ...mockResults];

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
        switch(item.category) {
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
                <h1>Find your perfect discovery.</h1>
                <div className="search-result-search-bar-container">
                    { isStaff && (
                        <button
                            className="action-circle-button primary-button"
                            onClick={() => setShowAddItemSheet(true)}
                        >
                            <FaPlus />
                        </button>
                    )}
                    <input type="text" placeholder="Search..." className="search-result-search-bar" />
                </div>
            </div>
            <div className="search-results-contents">
            <div className="filter-section">
                {filters.map((filter) => (
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
                    ))}
            </div>
                <div className="search-results-list">
                    {multipleMockResults.map((item) => {
                        return (
                        <div key={item.item_id} className={`search-result-item ${item.category.toLowerCase()}`}>
                            <div className="result-info">
                                <div>
                                    <img src={item.thumbnail} alt={item.title} className="result-thumbnail" />
                                </div>
                                <div className='result-text-info'>
                                    <h3 className="result-title">
                                    {/* This should be href={`/item-details/${item.item_id}`} when not testing.*/}
                                    <a href={`/item-details`} className="result-link">
                                        {item.title}
                                    </a>
                                    </h3>
                                    <div className="result-description">
                                        {renderItemDetails(item)}
                                        <div className="availability-status">
                                            <p><strong>Holds:</strong> <span>{item.holds}</span></p>
                                            <p><strong>Available:</strong> <span>{item.available}</span></p>
                                            {
                                                item.available == 0 && (
                                                <p><strong>Earliest Available:</strong> <span>{item.earliestAvailable}</span></p>
                                                )
                                            }
                                        </div>

                                    </div>
                                </div>
                                <div className="result-actions">
                                    {renderItemActionButtons(item)}
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