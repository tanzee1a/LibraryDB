import './item_details.css';
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaRegFileAlt } from "react-icons/fa";
import { IoMdGlobe } from "react-icons/io";
import { IoBookOutline, IoCalendarClearOutline, IoBarcodeOutline, IoInformationCircleOutline, IoTimerOutline } from "react-icons/io5";
import { MdDevicesOther } from "react-icons/md";
import { TbBuildingFactory2 } from "react-icons/tb";
import { BsTicketPerforated } from "react-icons/bs";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; 

function ItemDetails({ isStaff }) {
  const { itemId } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- ADD NEW STATE ---
  // State for handling the loan request action (pickup or waitlist)
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Used to display success/error messages
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' }); 
  // Used to hide buttons after a successful request
  const [requestMade, setRequestMade] = useState(false);
  // --- END NEW STATE ---

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
              <button className="action-button secondary-button">Edit</button>
            )}
            <div className="availability-info">
              <p><strong>Available:</strong> <span>{item.available}</span></p>
              {item.available <= 0 && item.on_hold > 0 && <p><strong>On Hold:</strong> <span>{item.on_hold}</span></p>}
               {item.available <= 0 && (
                  <p><strong>Earliest Available:</strong> <span>{item.earliest_available_date ? new Date(item.earliest_available_date).toLocaleDateString() : 'N/A'}</span></p>
              )}
            </div>

            {/* --- UPDATE THIS SECTION --- */}

            {/* Display Success/Error Messages */}
            {actionMessage.text && (
              <p className={`action-message ${actionMessage.type}`}>
                {actionMessage.text}
              </p>
            )}

            {/* Only show buttons if a request hasn't been successfully made */}
            {!requestMade && (
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
    </div>
  )
}

export default ItemDetails