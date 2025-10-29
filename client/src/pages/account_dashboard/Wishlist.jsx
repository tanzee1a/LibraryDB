import React, { useState, useEffect } from 'react';
import { IoHeartOutline, IoHourglassOutline } from 'react-icons/io5';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; 
export default function Wishlist() {
  const [holds, setHolds] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Helper function to get headers (to avoid repetition)
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    if (!token) return null; // Indicate missing token

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // --- Fetch Holds and Wishlist ---
  const fetchData = () => {
    const headers = getAuthHeaders();

    if (!headers) {
        console.error("Authentication Error: No token found. User needs to log in.");
        setError('Please log in to view your items.');
        setLoading(false);
        return; 
    }

    setLoading(true);
    setError('');
    Promise.all([
      fetch(`${API_BASE_URL}/api/my-holds`, { headers }).then(r => r.ok ? r.json() : Promise.reject('Failed holds fetch')),
      fetch(`${API_BASE_URL}/api/my-wishlist`, { headers }).then(r => r.ok ? r.json() : Promise.reject('Failed wishlist fetch'))
    ])
    .then(([holdsData, wishlistData]) => {
      setHolds(holdsData || []);
      setWishlistItems(wishlistData || []);
      setLoading(false);
    })
    .catch((err) => {
      console.error("Fetch Wishlist/Holds Error:", err);
      setError('Could not load items.');
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Handle Remove from Wishlist ---
  const handleUnsave = (itemId) => {
    const headers = getAuthHeaders();

    if (!headers) {
        alert('Authentication required to remove items.');
        return;
    }
    
    // 🔑 FIX APPLIED HERE: Added headers and method to the fetch options
    fetch(`${API_BASE_URL}/api/wishlist/${itemId}`, { 
        method: 'DELETE', 
        headers: headers // Send the Authorization header
    })
      .then(r => { 
          if (r.status === 401) throw new Error('Unauthorized. Please re-login.');
          if (!r.ok) throw new Error('Unsave failed on the server.'); 
          return r.json(); 
      })
      .then(() => {
         fetchData(); // Refresh lists
      })
      .catch((err) => {
        console.error("Unsave Item Error:", err);
        alert(`Error removing item: ${err.message}`);
      });
  };

  // --- Render Logic ---
  if (loading) return <div>Loading items…</div>;
  // NOTE: Updated error message for better clarity on a blank slate
  if (error) return <div>{error}</div>;

  return (
    <div>
      {/* Section for Holds (Pending Pickup) - No change needed here */}
      <h4>Requested for Pickup</h4>
      {holds.length === 0 ? (
        <div className="list-item" style={{ padding: '8px 0' }}>
          <div className="thumb-icon" aria-hidden="true"><IoHourglassOutline /></div>
          <div>No items currently requested for pickup.</div>
        </div>
      ) : (
        <ul className="list">
          {holds.map(h => (
            <li key={`hold-${h.hold_id}`} className="list-item">
              {/* Image */}
              <img 
                  src={h.thumbnail_url || '/placeholder-image.png'} 
                  alt={h.title} 
                  className="thumb"
                  onError={(e) => { e.target.onerror = null; e.target.src='/placeholder-image.png'; }}
              />
              <div>
                <div className="item-title">{h.title}</div>
                <div className="item-sub">Requested: {new Date(h.created_at).toLocaleDateString()}</div>
                <div className="item-sub">Pickup Expires: {new Date(h.expires_at).toLocaleDateString()}</div>
              </div>
              <div>
                 {/* Optional: Add Cancel Hold button later */}
                 
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Section for Wishlist (Saved Items) */}
      <h4 style={{ marginTop: '20px' }}>Saved for Later</h4>
       {wishlistItems.length === 0 ? (
        <div className="list-item" style={{ padding: '8px 0' }}>
          <div className="thumb-icon" aria-hidden="true"><IoHeartOutline /></div>
          <div>Items you save will show up here.</div>
        </div>
      ) : (
        <ul className="list">
          {wishlistItems.map(w => (
            <li key={`wish-${w.item_id}`} className="list-item">
              {/* Image */}
              <img 
                  src={w.thumbnail_url || '/placeholder-image.png'} 
                  alt={w.title} 
                  className="thumb"
                  onError={(e) => { e.target.onerror = null; e.target.src='/placeholder-image.png'; }}
              />
              <div>
                <div className="item-title">{w.title}</div>
                <div className="item-sub">Saved: {new Date(w.created_at).toLocaleDateString()}</div>
              </div>
              <div>
                <button className="btn danger" onClick={() => handleUnsave(w.item_id)}>Remove</button>
                 {/* Optional: Add Request/Borrow button later */}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}