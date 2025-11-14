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

  // --- State for User Profile/Suspension/Membership ---
  const [userProfile, setUserProfile] = useState({ 
    is_suspended: false, 
    total_fines: 0.00, 
    requires_membership: false, 
    membership_status: null 
  });
  const [userProfileLoading, setUserProfileLoading] = useState(true);

  // State for handling the loan request action (pickup or waitlist)
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Used to display success/error messages
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' }); 
  // Used to hide buttons after a successful request
  const [requestMade, setRequestMade] = useState(false);

  // --- WISHLIST ---
  const [isWishlistSubmitting, setIsWishlistSubmitting] = useState(false);
  const [wishlistMessage, setWishlistMessage] = useState({ type: '', text: '' });
  const [isWishlisted, setIsWishlisted] = useState(false); 

  // --- EDIT SHEET ---
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [formData, setFormData] = useState(null); 
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editMessage, setEditMessage] = useState({ type: '', text: '' });
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);
  const [isReactivateSubmitting, setIsReactivateSubmitting] = useState(false);
  const [editSheetView, setEditSheetView] = useState('form'); // 'form', 'confirm_delete', 'confirm_reactivate'


  const staffRole = localStorage.getItem('staffRole');
  const isAuthorizedToEdit = isStaff && (staffRole === 'Librarian' || staffRole === 'Assistant Librarian');


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
              total_fines: Number(data.outstanding_fines) || 0.00,
              requires_membership: data.requires_membership_fee,
              membership_status: data.membership_status
          });
      } else {
          setUserProfile({ 
              is_suspended: false, 
              total_fines: 0.00,
              requires_membership: false,
              membership_status: null 
          }); 
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setUserProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [isStaff]);


  const handleWishlistAction = async () => {
    if (isWishlistSubmitting) return;

    const headers = getAuthHeaders();
    if (!headers) {
      setWishlistMessage({ type: 'error', text: 'You must be logged in to save items.' });
      return;
    }

    setIsWishlistSubmitting(true);
    setWishlistMessage({ type: '', text: '' });
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/wishlist/${itemId}`, {
        method: 'POST', 
        headers: headers,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'An error occurred.'); 
      }

      setWishlistMessage({ type: 'success', text: 'Saved for later!' });
      setIsWishlisted(true); 

    } catch (err) {
      setWishlistMessage({ type: 'error', text: err.message || 'Could not save item.' });
    } finally {
      setIsWishlistSubmitting(false);
    }
  };
  
  const handleLoanAction = async (actionType) => {
    if (isSubmitting) return; 
    const token = localStorage.getItem('authToken'); 
    if (!token) {
      setActionMessage({ type: 'error', text: 'You must be logged in to make a request.' });
      return;
    }

    setIsSubmitting(true);
    setActionMessage({ type: '', text: '' }); 

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

      setActionMessage({
        type: 'success',
        text: actionType === 'request' 
          ? 'Pickup requested successfully!' 
          : 'You have been added to the waitlist!'
      });
      setRequestMade(true); 

    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Could not complete your request.' });
    } finally {
      setIsSubmitting(false); 
    }
  };

  const handleEditClick = () => {
    if (!item) return;
    
    setFormData({
      ...item,
      title: item.category === 'DEVICE' ? item.device_name : item.title,
      tags: item.tags ? item.tags.join(', ') : '',
      creators: item.creators ? item.creators.join(', ') : '',
      published_date: item.published_date ? new Date(item.published_date).toISOString().split('T')[0] : '',
      quantity: item.quantity || 0, 
    });
    
    setEditMessage({ type: '', text: '' }); 
    setEditSheetView('form');
    setShowEditSheet(true); 
  };

  const handleDeleteClick = () => {
    setEditMessage({ type: '', text: '' });
    setEditSheetView('confirm_delete');
  };

  const handleReactivateClick = () => {
    setEditMessage({ type: '', text: '' });
    setEditSheetView('confirm_reactivate');
  };

  const handleFormChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setEditMessage({ type: '', text: '' });
    setIsEditSubmitting(true);

    const headers = getAuthHeaders(); 
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
            device_name: formData.title, 
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
      
      setTimeout(() => {
        window.location.reload(); 
      }, 1500);

    } catch (err) {
      setEditMessage({ type: 'error', text: err.message || 'Could not update item.' });
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (item.loaned_out > 0 || item.on_hold > 0) {
      setEditMessage({ type: 'error', text: 'Cannot delete item: It is currently loaned out or on hold.' });
      return;
    }

    setIsDeleteSubmitting(true);
    setEditMessage({ type: '', text: '' });

    const headers = getAuthHeaders();
    if (!headers) {
      setEditMessage({ type: 'error', text: 'Authentication failed.' });
      setIsDeleteSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/items/${itemId}`, {
        method: 'DELETE',
        headers: headers
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete item.');
      }
      
      setEditMessage({ type: 'success', text: 'Item marked as deleted.' });
      
      setItem(prev => ({ ...prev, status: 'DELETED' }));
      setFormData(prev => ({ ...prev, status: 'DELETED' }));
      setEditSheetView('form');

    } catch (err) {
      setEditMessage({ type: 'error', text: err.message });
    } finally {
      setIsDeleteSubmitting(false); 
    }
  };

  const handleConfirmReactivate = async () => {

    setIsReactivateSubmitting(true);
    setEditMessage({ type: '', text: '' });

    const headers = getAuthHeaders();
    if (!headers) {
      setEditMessage({ type: 'error', text: 'Authentication failed.' });
      setIsReactivateSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/items/${itemId}/reactivate`, {
        method: 'PUT',
        headers: headers
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to reactivate item.');
      }
      
      setEditMessage({ type: 'success', text: 'Item reactivated successfully.' });
      
      setItem(prev => ({ ...prev, status: 'ACTIVE' }));
      setFormData(prev => ({ ...prev, status: 'ACTIVE' }));
      setEditSheetView('form');

    } catch (err) {
      setEditMessage({ type: 'error', text: err.message });
    } finally {
      setIsReactivateSubmitting(false);
    }
  };
  
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
                src={item.thumbnail_url || '/placeholder-image.png'} 
                alt={item.title || 'Item thumbnail'} 
                className="thumbnail" 
                onError={(e) => { e.target.onerror = null; e.target.src='/placeholder-image.png'; }}
            />
            { isAuthorizedToEdit && ( 
               <button
               className="action-button secondary-button"
               onClick={handleEditClick}>
                Edit
              </button>
              )}
            <div className="availability-info">
              <p><strong>Available:</strong> <span>{item.available}</span></p>
              {item.available <= 0 && item.on_hold > 0 && <p><strong>On Hold:</strong> <span>{item.on_hold}</span></p>}
            </div>

            {(userProfileLoading && !isStaff) && (
                <p className={`action-message`}>Loading User Status...</p>
            )}

            {
                !userProfileLoading && !isStaff && (() => {
                    const isSuspended = userProfile.is_suspended;
                    const membershipExpired = userProfile.requires_membership && userProfile.membership_status !== 'active';
                    
                    if (isSuspended || membershipExpired) {
                        let denialMessage = isSuspended ? 'Account Suspended (Fines)' : 'Membership Required';
                        let subMessage = isSuspended 
                            ? `⚠️ Borrowing suspended due to outstanding fines ($${Number(userProfile.total_fines || 0).toFixed(2)}).`
                            : `⚠️ Borrowing denied. Your membership is currently not active.`;

                        return (
                            <div className="search-item-actions" style={{ marginTop: '10px' }}>
                                <button className="action-button primary-button disabled-button" disabled>
                                    {denialMessage}
                                </button>
                                <p className="action-message error">{subMessage}</p>
                            </div>
                        );
                    }
                    
                    return null;
                })()
            }

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

            {(!isWishlisted && !isStaff && !(userProfile.is_suspended || (userProfile.requires_membership && userProfile.membership_status !== 'active'))) && (
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

            {(!requestMade && !isStaff && !(userProfile.is_suspended || (userProfile.requires_membership && userProfile.membership_status !== 'active'))) && (
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
        <div className="sheet-overlay" onClick={() => !(isEditSubmitting || isDeleteSubmitting || isReactivateSubmitting) && setShowEditSheet(false)}>
          <div className="sheet-container" onClick={(e) => e.stopPropagation()}>
            {/* VIEW 1: THE EDIT FORM (DEFAULT) */}
            {editSheetView === 'form' && (
              <>
                <h2>Edit Item: {item.title || item.device_name}</h2>
                
                {editMessage.text && (
                  <p className={`action-message ${editMessage.type}`}>
                    {editMessage.text}
                  </p>
                )}
                
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

                  {item.category === 'BOOK' && renderBookFields()}
                  {item.category === 'MOVIE' && renderMovieFields()}
                  {item.category === 'DEVICE' && renderDeviceFields()}

                  <div className="sheet-actions">
                    
                    {item.status === 'ACTIVE' ? (
                      <button
                          type="button"
                          className="action-button red-button"
                          onClick={handleDeleteClick} 
                          disabled={isEditSubmitting || isDeleteSubmitting || isReactivateSubmitting}
                      >
                          Delete Item
                      </button>
                    ) : (
                      <button
                          type="button"
                          className="action-button secondary-button" 
                          onClick={handleReactivateClick}
                          disabled={isEditSubmitting || isDeleteSubmitting || isReactivateSubmitting}
                      >
                          Reactivate Item
                      </button>
                    )}

                    <button 
                        type="submit" 
                        className="action-button primary-button" 
                        disabled={isEditSubmitting || isDeleteSubmitting || isReactivateSubmitting}
                    >
                        {isEditSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                        type="button"
                        className="action-button secondary-button"
                        onClick={() => setShowEditSheet(false)}
                        disabled={isEditSubmitting || isDeleteSubmitting || isReactivateSubmitting}
                    >
                        Cancel
                    </button>
                  </div>
                </form>
              </>
            )}
            {/* VIEW 2: CONFIRM DELETE */}
            {editSheetView === 'confirm_delete' && (
              <>
                <h2>Delete Item</h2>
                <p>Are you sure you want to mark this item as 'Deleted'? Users will no longer see it.</p>
                
                {editMessage.text && (
                  <p className={`action-message ${editMessage.type}`}>
                    {editMessage.text}
                  </p>
                )}

                <div className="sheet-actions">
                  <button
                    type="button"
                    className="action-button red-button"
                    onClick={handleConfirmDelete}
                    disabled={isDeleteSubmitting}
                  >
                    {isDeleteSubmitting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                  <button
                    type="button"
                    className="action-button secondary-button"
                    onClick={() => setEditSheetView('form')}
                    disabled={isDeleteSubmitting}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
            {/* VIEW 3: CONFIRM REACTIVATE */}
            {editSheetView === 'confirm_reactivate' && (
              <>
                <h2>Reactivate Item</h2>
                <p>Are you sure you want to reactivate this item? It will become visible to users again.</p>
                
                {editMessage.text && (
                  <p className={`action-message ${editMessage.type}`}>
                    {editMessage.text}
                  </p>
                )}

                <div className="sheet-actions">
                  <button
                    type="button"
                    className="action-button primary-button"
                    onClick={handleConfirmReactivate}
                    disabled={isReactivateSubmitting}
                  >
                    {isReactivateSubmitting ? 'Reactivating...' : 'Yes, Reactivate'}
                  </button>
                  <button
                    type="button"
                    className="action-button secondary-button"
                    onClick={() => setEditSheetView('form')}
                    disabled={isReactivateSubmitting}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  )
}

export default ItemDetails