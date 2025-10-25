import './item_details.css';
import React, { useState, useEffect } from 'react'; // <<< Add useEffect here
import { useParams } from 'react-router-dom';
//import bookThumbnail from '../../assets/book_thumbnail.jpeg';
//import mediaThumbnail from '../../assets/media_thumbnail.jpg';
//import deviceThumbnail from '../../assets/device_thumbnail.jpeg';
import { FaRegFileAlt } from "react-icons/fa";
import { IoMdGlobe } from "react-icons/io";
import { IoBookOutline, IoCalendarClearOutline, IoBarcodeOutline, IoInformationCircleOutline, IoTimerOutline } from "react-icons/io5";
import { MdDevicesOther } from "react-icons/md";
import { TbBuildingFactory2 } from "react-icons/tb";
import { BsTicketPerforated } from "react-icons/bs";

// import sampleData from '../../assets/sample_data.json'

function ItemDetails({ isStaff }) {
// --- Add State & Params ---
  const { itemId } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // --- End Add State ---

  // --- Add useEffect for fetching ---
  useEffect(() => {
    if (itemId) {
      setLoading(true);
      setError('');
      // Fetch from specific item endpoint
      fetch(`http://localhost:5000/api/items/${itemId}`) // Adjust URL if needed
        .then(r => {
          if (r.status === 404) throw new Error('Item not found');
          if (!r.ok) throw new Error('Network response failed');
          return r.json();
        })
        .then(data => {
          // --- TODO: Enhance Backend ---
          // This 'data' currently only has ITEM table fields.
          // You MUST update the backend GET /api/items/:id endpoint to JOIN
          // with BOOK/MOVIE/DEVICE and related tables (AUTHOR, DIRECTOR, TAG, LANGUAGE etc.)
          // based on data.category to get ALL details needed below.
          // For now, we only set the basic item data.
          setItem(data);
          // --- End TODO ---
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || 'Could not load item details.');
          setLoading(false);
        });
    }
  }, [itemId]);
  // --- End useEffect ---

  // --- Add Loading/Error states ---
  if (loading) return <div className="page-container"><p>Loading item details...</p></div>;
  if (error) return <div className="page-container"><p style={{ color: 'red' }}>Error: {error}</p></div>;
  if (!item) return <div className="page-container"><p>Item data could not be loaded.</p></div>;
  // --- End Loading/Error states ---

  const renderAdditionalInfo = () => {
  // --- TODO: Fetch specific details ---
    // This needs the enhanced backend endpoint mentioned above.
    switch (item.category) { // Use fetched category
      case "BOOK":
        return <p>Book details loading... (Requires backend update)</p>;
      case "MOVIE": // Use MOVIE based on ITEM.category
        return <p>Movie details loading... (Requires backend update)</p>;
      case "DEVICE":
        return <p>Device details loading... (Requires backend update)</p>;
      default: return null;
    }
  };

  const creatorInfo = (() => {
// --- TODO: Fetch specific details ---
     if (item.category === "BOOK") {
       return { label: "written by", names: "Author(s) loading..." };
     }
     if (item.category === "MOVIE") {
       return { label: "directed by", names: "Director(s) loading..." };
     }
     return null;
   })();

  const tagsDisplay = "Tags loading..."; // --- TODO: Fetch specific details ---
  
  return (
    <div>
      <div className="page-container">
        <div className="item-details-container">
          <div className="thumbnail-section">
            <img src={thumbnail} alt="Item thumbnail" className="thumbnail" />
            { isStaff && (
              <button className="action-button secondary-button">Edit</button>
            )}
            <div className="availability-info">
              {/* Use fetched item data */}
              <p><strong>Available:</strong> <span>{item.available}</span></p>
              {item.available <= 0 && item.on_hold > 0 && <p><strong>On Hold:</strong> <span>{item.on_hold}</span></p>}
               {item.available <= 0 && (
                  <p><strong>Earliest Available:</strong> <span>{item.earliest_available_date ? new Date(item.earliest_available_date).toLocaleDateString() : 'N/A'}</span></p>
              )}
            </div>
            {/* TODO: Connect Borrow/Hold buttons */}
            {item.available > 0 ? (
              <button className="action-button primary-button">Borrow</button>
            ) : (
              <button className="action-button secondary-button">Place Hold</button>
            )}
          </div>

          <div className="details-section">
            {/* Use fetched item data */}
            <h1 className="item-title">{item.title || 'Loading title...'}</h1>
            {/* ... (keep creatorInfo rendering) ... */}
             {creatorInfo && (
              <p className="item-author">
                {creatorInfo.label}{" "}
                <span className="item-author-name">{creatorInfo.names}</span>
              </p>
            )}
            <hr className="divider" />
            <p className='item-description'>{item.description}</p>
            <hr className="divider" />
            <ul className="additional-info">{renderAdditionalInfo()}</ul>
            <hr className="divider" />
            <div className="tags-section">
              <p className="tags-title"><strong>Tags:</strong> {item.tags.join(", ")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ItemDetails