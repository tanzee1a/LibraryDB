import './item_details.css';
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaRegFileAlt } from "react-icons/fa";
import { IoMdGlobe } from "react-icons/io";
import { IoBookOutline, IoCalendarClearOutline, IoBarcodeOutline, IoInformationCircleOutline, IoTimerOutline } from "react-icons/io5";
import { MdDevicesOther } from "react-icons/md";
import { TbBuildingFactory2 } from "react-icons/tb";
import { BsTicketPerforated } from "react-icons/bs";


function ItemDetails({ isStaff }) {
  const { itemId } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (itemId) {
      setLoading(true);
      setError('');
      fetch(`http://localhost:5000/api/items/${itemId}`)
        .then(r => {
          if (r.status === 404) throw new Error('Item not found');
          if (!r.ok) throw new Error('Network response failed');
          return r.json();
        })
        .then(data => {
          setItem(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || 'Could not load item details.');
          setLoading(false);
        });
    }
  }, [itemId]);

  if (loading) return <div className="page-container"><p>Loading item details...</p></div>;
  if (error) return <div className="page-container"><p style={{ color: 'red' }}>Error: {error}</p></div>;
  if (!item) return <div className="page-container"><p>Item data could not be loaded.</p></div>;

const renderAdditionalInfo = () => {
    switch (item.category) {
      case "BOOK":
        return (
          <>
            <li><IoBookOutline /> Pages: {item.page_number || 'N/A'}</li>
            <li><IoMdGlobe /> Language: {item.language_name || 'N/A'}</li>
            <li><BsTicketPerforated /> Publisher: {item.publisher || 'N/A'}</li>
            <li><IoCalendarClearOutline /> Published: {item.published_date ? new Date(item.published_date).toLocaleDateString() : 'N/A'}</li>
          </>
        );
      case "MOVIE":
        return (
           <>
            <li><IoTimerOutline /> Runtime: {item.runtime ? `${item.runtime} mins` : 'N/A'}</li>
            <li><IoMdGlobe /> Language: {item.language_name || 'N/A'}</li>
            <li><FaRegFileAlt /> Format: {item.format_name || 'N/A'}</li>
            <li><IoInformationCircleOutline/> Rating: {item.rating_name || 'N/A'}</li>
            <li><IoCalendarClearOutline /> Released: {item.release_year || 'N/A'}</li>
          </>
        );
      case "DEVICE":
        return (
           <>
            <li><TbBuildingFactory2 /> Manufacturer: {item.manufacturer || 'N/A'}</li>
            <li><MdDevicesOther /> Type: {item.device_type_name || 'N/A'}</li>
          </>
        );
      default: return null;
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
       return { label: "manufacturer ", names: names }; 
     }
     return null;
  })();

  const tagsDisplay = item.tags && item.tags.length > 0 ? item.tags.join(', ') : 'None';
  
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
            {/* TODO: Connect Borrow/Hold buttons */}
            {item.available > 0 ? (
              <button className="action-button primary-button">Borrow</button>
            ) : (
              <button className="action-button secondary-button">Place Hold</button>
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