import './item_details.css';
import '../catalog_page/search_results.css';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaRegFileAlt } from "react-icons/fa";
import { IoMdGlobe } from "react-icons/io";
import { IoBookOutline, IoCalendarClearOutline, IoBarcodeOutline, IoInformationCircleOutline, IoTimerOutline, IoHeartOutline } from "react-icons/io5";
import { MdDevicesOther } from "react-icons/md";
import { TbBuildingFactory2 } from "react-icons/tb";
import { BsTicketPerforated } from "react-icons/bs";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; 

function ItemDetails({ isStaff }) {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [userProfile, setUserProfile] = useState({ is_suspended: false, total_fines: 0.00 });
  const [userProfileLoading, setUserProfileLoading] = useState(true);

  // --- ADD NEW STATE ---
  // State for handling the loan request action (pickup or waitlist)
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Used to display success/error messages
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' }); 
  // Used to hide buttons after a successful request
  const [requestMade, setRequestMade] = useState(false);
  // --- END NEW STATE ---

  // --- ADD STATE FOR WISHLIST ---
  const [isWishlistSubmitting, setIsWishlistSubmitting] = useState(false);
  const [wishlistMessage, setWishlistMessage] = useState({ type: '', text: '' });
  const [isWishlisted, setIsWishlisted] = useState(false); // We'll need to check this
  // --- END ADD ---

  // --- ADD THIS NEW STATE FOR EDIT SHEET ---
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [formData, setFormData] = useState(null); // Will hold form data
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editMessage, setEditMessage] = useState({ type: '', text: '' });
  // --- END ADD ---
  const [isDeleting, setIsDeleting] = useState(false);

  // --- ADD: Function to get headers ---
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken'); 
    if (!token) return null;
    return {
      'Authorization': `Bearer ${token}`, 
      'Content-Type': 'application/json'
    };
  };

  useEffect(() => {
    if (itemId) {
      setLoading(true);
      setError('');
      fetch(`${API_BASE_URL}/api/items/${itemId}`)
        .then(r => {
          if (r.status === 404) throw new Error('Item not found');
          if (!r.ok) throw new Error('Network response failed');
          return r.json();
        })
        .then(data => {
          setItem(data);
          console.log('Fetched item data:', data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || 'Could not load item details.');
          setLoading(false);
        });
    }
  }, [itemId]);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    // Only fetch if a user is logged in AND they are not staff
    if (!token || isStaff) {
      setUserProfileLoading(false);
      return;
    }

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
            // Convert to number here, using the Number() constructor for safety
            total_fines: Number(data.outstanding_fines) || 0.00
          });
        } else {
          // Failed to fetch profile (e.g., token expired)
          setUserProfile({ is_suspended: false, total_fines: 0.00 });
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setUserProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [isStaff]);


  // --- ADD: New handler for Wishlist ---
  const handleWishlistAction = async () => {
    if (isWishlistSubmitting) return;

    const headers = getAuthHeaders();
    if (!headers) {
      setWishlistMessage({ type: 'error', text: 'You must be logged in to save items.' });
      return;
    }

    setIsWishlistSubmitting(true);
    setWishlistMessage({ type: '', text: '' });
    
    // We'll assume POST to add, DELETE to remove.
    // TODO: You'll need logic to check if item is *already* wishlisted.
    // For now, this just adds it.
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/wishlist/${itemId}`, {
        method: 'POST', // Use 'DELETE' to remove
        headers: headers,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'An error occurred.'); 
      }

      // Success!
      setWishlistMessage({ type: 'success', text: 'Saved for later!' });
      setIsWishlisted(true); // Disable the button

    } catch (err) {
      setWishlistMessage({ type: 'error', text: err.message || 'Could not save item.' });
    } finally {
      setIsWishlistSubmitting(false);
    }
  };
  // --- END ADD ---

  // --- ADD NEW HANDLER FUNCTION ---
  /**
   * Handles both "Request Pickup" and "Join Waitlist" actions.
   * @param {'request' | 'waitlist'} actionType 
   */
  const handleLoanAction = async (actionType) => {
    if (isSubmitting) return; // Prevent double-clicks

    // --- Authentication ---
    // This assumes you store your auth token in localStorage.
    // !! Replace this with your actual auth token retrieval logic !!
    const token = localStorage.getItem('authToken'); 
    if (!token) {
      setActionMessage({ type: 'error', text: 'You must be logged in to make a request.' });
      return;
    }
    // ------------------------

    setIsSubmitting(true);
    setActionMessage({ type: '', text: '' }); // Clear previous messages

    // Determine the correct backend endpoint
    const endpoint = actionType === 'request'
      ? `/api/request/${itemId}`
      : `/api/waitlist/${itemId}`;
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          // Send the token for your 'protect' middleware
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json'
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Use the error message from the backend
        throw new Error(data.message || 'An error occurred.'); 
      }

      // Success!
      setActionMessage({
        type: 'success',
        text: actionType === 'request' 
          ? 'Pickup requested successfully!' 
          : 'You have been added to the waitlist!'
      });
      setRequestMade(true); // Hide the buttons

    } catch (err) {
      // Display the error
      setActionMessage({ type: 'error', text: err.message || 'Could not complete your request.' });
    } finally {
      setIsSubmitting(false); // Re-enable button (if error occurred)
    }
  };
  // --- END NEW HANDLER FUNCTION ---

  const handleEditClick = () => {
    if (!item) return;
    
    // Pre-populate formData with item data
    setFormData({
      ...item,
      // Use device_name for title if it's a device
      title: item.category === 'DEVICE' ? item.device_name : item.title,
      // Convert arrays to comma-separated strings for the input field
      tags: item.tags ? item.tags.join(', ') : '',
      creators: item.creators ? item.creators.join(', ') : '',
      // Format date for <input type="date">
      published_date: item.published_date ? new Date(item.published_date).toISOString().split('T')[0] : '',
      quantity: item.quantity || 0, 
    });
    
    setEditMessage({ type: '', text: '' }); // Clear old messages
    setShowEditSheet(true); // Open the sheet
  };

  // Updates formData state as user types
  const handleFormChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  // Submits the edit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setEditMessage({ type: '', text: '' });
    setIsEditSubmitting(true);

    const headers = getAuthHeaders(); // Uses your existing function
    if (!headers) {
      setEditMessage({ type: 'error', text: 'You must be logged in.' });
      setIsEditSubmitting(false);
      return;
    }

    let endpoint = '';
    let body = {};
    const tags = formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    const creators = formData.creators ? formData.creators.split(',').map(c => c.trim()).filter(Boolean) : [];

    const commonData = {
        title: formData.title,
        description: formData.description,
        thumbnail_url: formData.thumbnail_url,
        shelf_location: formData.shelf_location,
        quantity: parseInt(formData.quantity) || 0,
        language_id: parseInt(formData.language_id) || null,
        tags: tags,
    };

    try {
      switch (item.category) {
        case 'BOOK':
          endpoint = `${API_BASE_URL}/api/items/book/${itemId}`;
          body = {
            ...commonData,
            publisher: formData.publisher,
            published_date: formData.published_date ? new Date(formData.published_date).toISOString().split('T')[0] : null,
            page_number: parseInt(formData.page_number) || 0,
            authors: creators,
          };
          break;
        case 'MOVIE':
          endpoint = `${API_BASE_URL}/api/items/movie/${itemId}`;
          body = {
            ...commonData,
            format_id: parseInt(formData.format_id) || null,
            runtime: parseInt(formData.runtime) || 0,
            rating_id: parseInt(formData.rating_id) || null,
            release_year: parseInt(formData.release_year) || 0,
            directors: creators,
          };
          break;
        case 'DEVICE':
          endpoint = `${API_BASE_URL}/api/items/device/${itemId}`;
          body = {
            device_name: formData.title, // 'title' in form maps to 'device_name'
            description: formData.description,
            thumbnail_url: formData.thumbnail_url,
            shelf_location: formData.shelf_location,
            quantity: parseInt(formData.quantity) || 0,
            tags: tags,
            manufacturer: formData.manufacturer,
            device_type: parseInt(formData.device_type) || null,
          };
          break;
        default:
          throw new Error('Unknown item category.');
      }

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'An error occurred.');
      }

      setEditMessage({ type: 'success', text: 'Item updated successfully!' });
      
      // Reload the page to see changes
      setTimeout(() => {
        window.location.reload(); 
      }, 1500);

    } catch (err) {
      setEditMessage({ type: 'error', text: err.message || 'Could not update item.' });
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDelete = async () => {
    // 1. Confirm with the user first!
    if (!window.confirm("Are you sure you want to permanently delete this item? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    setEditMessage({ type: '', text: '' }); // Clear other messages

    const headers = getAuthHeaders(); // Use your existing helper
    if (!headers) {
      setEditMessage({ type: 'error', text: 'Authentication failed.' });
      setIsDeleting(false);
      return;
    }

    try {
      // 2. Call the DELETE endpoint
      const response = await fetch(`${API_BASE_URL}/api/items/${itemId}`, {
        method: 'DELETE',
        headers: headers
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete item.');
      }
      
      // 3. Handle Success
      setEditMessage({ type: 'success', text: 'Item deleted successfully. Redirecting...' });
      
      // 4. Redirect to the home page (or search page)
      setTimeout(() => {
        navigate('/search'); // Redirect to home
      }, 2000);

    } catch (err) {
      setEditMessage({ type: 'error', text: err.message });
      setIsDeleting(false); // Re-enable button on error
    }
  };
  
  // These render functions will be used *inside* the edit sheet
  const renderBookFields = () => (
    <>
      <label>Authors (comma-separated): 
        <input type="text" name="creators" value={formData.creators || ''} onChange={handleFormChange} className="edit-input" />
      </label>
      <label>Publisher: 
        <input type="text" name="publisher" value={formData.publisher || ''} onChange={handleFormChange} className="edit-input" />
      </label>
      <label>Published Date: 
        <input type="date" name="published_date" value={formData.published_date || ''} onChange={handleFormChange} className="edit-input" />
      </label>
      <label>Page Count: 
        <input type="number" name="page_number" value={formData.page_number || ''} onChange={handleFormChange} className="edit-input" />
      </label>
      <label>Language ID: 
        <input type="number" name="language_id" value={formData.language_id || ''} onChange={handleFormChange} className="edit-input" />
      </label>
    </>
  );
  
  const renderMovieFields = () => (
    <>
      <label>Directors (comma-separated): 
        <input type="text" name="creators" value={formData.creators || ''} onChange={handleFormChange} className="edit-input" />
      </label>
      <label>Runtime (minutes): 
        <input type="number" name="runtime" value={formData.runtime || ''} onChange={handleFormChange} className="edit-input" />
      </label>
      <label>Release Year: 
        <input type="number" name="release_year" value={formData.release_year || ''} onChange={handleFormChange} className="edit-input" />
      </label>
      <label>Language ID: 
        <input type="number" name="language_id" value={formData.language_id || ''} onChange={handleFormChange} className="edit-input" />
      </label>
      <label>Format ID: 
        <input type="number" name="format_id" value={formData.format_id || ''} onChange={handleFormChange} className="edit-input" />
      </label>
       <label>Rating ID: 
        <input type="number" name="rating_id" value={formData.rating_id || ''} onChange={handleFormChange} className="edit-input" />
      </label>
    </>
  );

  const renderDeviceFields = () => (
    <>
      <label>Manufacturer: 
        <input type="text" name="manufacturer" value={formData.manufacturer || ''} onChange={handleFormChange} className="edit-input" />
      </label>
       <label>Device Type ID: 
        <input type="number" name="device_type" value={formData.device_type || ''} onChange={handleFormChange} className="edit-input" />
      </label>
    </>
  );

  if (loading) return <div className="page-container"><p>Loading item details...</p></div>;
  if (error) return <div className="page-container"><p style={{ color: 'red' }}>Error: {error}</p></div>;
  if (!item) return <div className="page-container"><p>Item data could not be loaded.</p></div>;

  const renderAdditionalInfo = () => {
        switch (item.category) {
        case "BOOK":
            return (
            <>
                <li>
                <span className="info-name">Pages</span>
                <span className="info-icon"><FaRegFileAlt /></span>
                <span className="info-detail">{item.page_number || 'N/A'}</span>
                </li>
                <li>
                <span className="info-name">Language</span>
                <span className="info-icon"><IoMdGlobe /></span>
                <span className="info-detail">{item.language_name || 'N/A'}</span>
                </li>
                <li>
                <span className="info-name">Publisher</span>
                <span className="info-icon"><IoBookOutline /></span>
                <span className="info-detail">{item.publisher || 'N/A'}</span>
                </li>
                <li>
                <span className="info-name">Publication Date</span>
                <span className="info-icon"><IoCalendarClearOutline /></span>
                <span className="info-detail">{item.published_date ? new Date(item.published_date).toLocaleDateString() : 'N/A'}</span>
                </li>
            </>
            );
        case "MOVIE":
            return (
            <>
                <li>
                    <span className="info-name">Runtime</span>
                    <span className="info-icon"><IoTimerOutline /></span>
                    <span className="info-detail">{item.runtime ? `${item.runtime} mins` : 'N/A'}</span>
                </li>
                <li>
                    <span className="info-name">Language</span>
                    <span className="info-icon"><IoMdGlobe /></span>
                    <span className="info-detail">{item.language_name || 'N/A'}</span>
                </li>
                <li>
                    <span className="info-name">Format</span>
                    <span className="info-icon"><IoInformationCircleOutline /></span>
                    <span className="info-detail">{item.format_name || 'N/A'}</span>
                </li>
                <li>
                    <span className="info-name">Rated</span>
                    <span className="info-icon"><BsTicketPerforated /></span>
                    <span className="info-detail">{item.rating_name || 'N/A'}</span>
                </li>
                <li>
                    <span className="info-name">Release Year</span>
                    <span className="info-icon"><IoCalendarClearOutline /></span>
                    <span className="info-detail">{item.release_year || 'N/A'}</span>
                </li>
            </>
            );
        case "DEVICE":
            return (
            <>
                <li>
                    <span className="info-name">Manufacturer</span>
                    <span className="info-icon"><TbBuildingFactory2 /></span>
                    <span className="info-detail">{item.manufacturer || 'N/A'}</span>
                </li>
                <li>
                    <span className="info-name">Device Type</span>
                    <span className="info-icon"><MdDevicesOther /></span>
                    <span className="info-detail">{item.device_type_name || 'N/A'}</span>
                </li>
            </>
            );
        default:
            return null;
        }
    };

  const creatorInfo = (() => {
     const names = item.creators && item.creators.length > 0 ? item.creators.join(', ') : 'N/A';
     
     if (item.category === "BOOK") {
       return { label: "written by", names: names };
     }
     if (item.category === "MOVIE") {
       return { label: "directed by", names: names };
     }
      if (item.category === "DEVICE") {
       return { label: "manufacturered by ", names: names }; 
     }
     return null;
  })();

  const renderTags = () => {
    return item.tags && item.tags.length > 0 ? item.tags.join(', ') : 'None';
  }
  
  return (
    <div>
      <div className="page-container">
        <div className="item-details-container">
          <div className="thumbnail-section">
            <img 
                src={item.thumbnail_url || '/placeholder-image.png'} // Use fetched URL or placeholder
                alt={item.title || 'Item thumbnail'} // Use fetched title for alt text
                className="thumbnail" 
                onError={(e) => { e.target.onerror = null; e.target.src='/placeholder-image.png'; }}
            />
            { isStaff && (
              <button 
              className="action-button secondary-button"
              onClick={handleEditClick}>
              Edit
            </button>
            )}
            <div className="availability-info">
              <p><strong>Available:</strong> <span>{item.available}</span></p>
              {item.available <= 0 && item.on_hold > 0 && <p><strong>On Hold:</strong> <span>{item.on_hold}</span></p>}
               {item.available <= 0 && (
                  <p><strong>Earliest Available:</strong> <span>{item.earliest_available_date ? new Date(item.earliest_available_date).toLocaleDateString() : 'N/A'}</span></p>
              )}
            </div>

            {/* --- UPDATE THIS SECTION --- */}
            {(userProfileLoading && !isStaff) && (
                <p className={`action-message`}>Loading User Status...</p>
            )}

            {/* Check 2: Suspension Status (Highest Priority) */}
            {(!userProfileLoading && !isStaff && userProfile.is_suspended) && (
                <div className="search-item-actions" style={{marginTop: '10px'}}>
                    <button className="action-button primary-button disabled-button" disabled>
                        Account Suspended
                    </button>
                    <p className="action-message error">
                        ⚠️ Borrowing is suspended due to outstanding fines ($${userProfile.total_fines.toFixed(2)}).
                    </p>
                </div>
            )}

            {/* Check 3: Display Success/Error Messages */}
            {actionMessage.text && (
                <p className={`action-message ${actionMessage.type}`}>
                    {actionMessage.text}
                </p>
            )}

            {wishlistMessage.text && (
                <p className={`action-message ${wishlistMessage.type}`}>
                    {wishlistMessage.text}
                </p>
            )}

            {/* Check 4: Wishlist Button (Always available unless suspended) */}
            {/* Disable if suspended (or submitting) */}
            {(!isWishlisted && !isStaff && !userProfile.is_suspended) && (
                <button
                    className="action-button secondary-button"
                    style={{ marginTop: '10px' }}
                    onClick={handleWishlistAction}
                    disabled={isWishlistSubmitting}
                >
                    <IoHeartOutline style={{ marginRight: '8px' }} />
                    {isWishlistSubmitting ? 'Saving...' : 'Save for Later'}
                </button>
            )}

            {/* Check 5: Loan/Waitlist Buttons (Only available if NOT suspended and request hasn't been made) */}
            {(!requestMade && !isStaff && !userProfile.is_suspended) && (
                item.available > 0 ? (
                    <button
                        className="action-button primary-button"
                        onClick={() => handleLoanAction('request')}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Requesting...' : 'Request Pickup'}
                    </button>
                ) : (
                    <button
                        className="action-button secondary-button"
                        onClick={() => handleLoanAction('waitlist')}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Joining...' : 'Join Waitlist'}
                    </button>
                )
            )}
            {/* --- END UPDATE --- */}
          </div>

          <div className="details-section">
            <h1 className="item-title">{item.title || 'Loading title...'}</h1>
             {creatorInfo && (
              <p className="item-author">
                {creatorInfo.label}{" "}
                <span className="item-author-name">{creatorInfo.names}</span>
              </p>
            )}
            <hr className="thin-divider" />
            <p className='item-description'>{item.description}</p>
            <hr className="thin-divider" />
            <ul className="additional-info">{renderAdditionalInfo()}</ul>
            <hr className="thin-divider" />
            <div className="tags-section">
              <p className="tags-title"><strong>Tags:</strong> {renderTags()}</p>
            </div>
          </div>
        </div>
      </div>
      {showEditSheet && formData && (
        <div className="sheet-overlay" onClick={() => !(isEditSubmitting || isDeleting) && setShowEditSheet(false)}>
          <div className="sheet-container" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Item: {item.title || item.device_name}</h2>
            
            {editMessage.text && (
              <p className={`action-message ${editMessage.type}`}>
                {editMessage.text}
              </p>
            )}
            
            {/* We use the same <label>...<input className="edit-input" /></label> structure */}
            {/* from search_results.jsx to get the same styling. */}
            <form onSubmit={handleFormSubmit}>
              <label> Title: 
                <input type="text" name="title" value={formData.title || ''} onChange={handleFormChange} required className="edit-input" />
              </label>
              <label> Description: 
                <textarea name="description" value={formData.description || ''} onChange={handleFormChange} className="edit-input" />
              </label>
              <label> Thumbnail URL: 
                <input type="url" name="thumbnail_url" value={formData.thumbnail_url || ''} onChange={handleFormChange} className="edit-input" />
              </label>
              <label> Shelf Location: 
                <input type="text" name="shelf_location" value={formData.shelf_location || ''} onChange={handleFormChange} className="edit-input" />
              </label>
              <label> Quantity (Total): 
                <input type="number" name="quantity" min="0" value={formData.quantity || 0} onChange={handleFormChange} required className="edit-input" />
              </label>
              <label> Tags (comma-separated): 
                <input type="text" name="tags" value={formData.tags || ''} onChange={handleFormChange} className="edit-input" />
              </label>

              {/* --- Conditional Fields --- */}
              {item.category === 'BOOK' && renderBookFields()}
              {item.category === 'MOVIE' && renderMovieFields()}
              {item.category === 'DEVICE' && renderDeviceFields()}

              {/* --- Actions --- */}
              <div className="sheet-actions">
                <button
                    type="button"
                    className="action-button red-button"
                    onClick={handleDelete}
                    disabled={isEditSubmitting || isDeleting}
                >
                    {isDeleting ? 'Deleting...' : 'Delete Item'}
                </button>
                <button 
                    type="submit" 
                    className="action-button primary-button" 
                    disabled={isEditSubmitting || isDeleting}
                >
                    {isEditSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                    type="button"
                    className="action-button secondary-button"
                    onClick={() => setShowEditSheet(false)}
                    disabled={isEditSubmitting || isDeleting}
                >
                    Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* --- END ADD --- */}
    </div>
  )
}

export default ItemDetails