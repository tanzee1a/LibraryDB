// Wishlist.jsx
import React, { useState, useEffect } from 'react';
import { IoHeartOutline } from 'react-icons/io5'; // Removed IoHourglassOutline

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; 

export default function Wishlist() {
  // Removed 'holds' state
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Helper function to get headers (no change)
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    if (!token) return null; 

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchWishlist = () => {
    const headers = getAuthHeaders();

    if (!headers) {
        console.error("Authentication Error: No token found.");
        setError('Please log in to view your items.');
        setLoading(false);
        return; 
    }

    setLoading(true);
    setError('');
    fetch(`${API_BASE_URL}/api/my-wishlist`, { headers })
      .then(r => {
        if (r.ok) return r.json();
        throw new Error('Failed to fetch wishlist');
      })
      .then(wishlistData => {
        setWishlistItems(wishlistData || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch Wishlist Error:", err);
        setError('Could not load your saved items.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchWishlist(); 
  }, []);

  const handleUnsave = (itemId) => {
    const headers = getAuthHeaders();

    if (!headers) {
        alert('Authentication required to remove items.');
        return;
    }
    
    fetch(`${API_BASE_URL}/api/wishlist/${itemId}`, { 
        method: 'DELETE', 
        headers: headers 
    })
      .then(r => { 
          if (r.status === 401) throw new Error('Unauthorized. Please re-login.');
          if (!r.ok) throw new Error('Unsave failed on the server.'); 
          return r.json(); 
      })
      .then(() => {
          fetchWishlist(); 
      })
      .catch((err) => {
        console.error("Unsave Item Error:", err);
        alert(`Error removing item: ${err.message}`);
      });
  };

  // --- Render Logic ---
  if (loading) return <div>Loading saved items…</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      {wishlistItems.length === 0 ? (
        <div className="list-item" style={{ padding: '8px 0' }}>
          <div className="thumb-icon" aria-hidden="true"><IoHeartOutline /></div>
          <div>Items you save will show up here.</div>
        </div>
      ) : (
        <ul className="list">
          {wishlistItems.map(w => (
            <li key={`wish-${w.item_id}`} className="list-item">
              <img 
                src={w.thumbnail_url || '/placeholder-image.png'} 
                alt={w.title} 
                className="thumb"
                onError={(e) => { e.target.onerror = null; e.target.src='/placeholder-image.png'; }}
              />
              <div>
                <div className="item-title"><a className='result-link' href={`/item/${w.item_id}`}>{w.title}</a></div>
                <div className="item-sub">Saved: {new Date(w.created_at).toLocaleDateString()}</div>
              </div>
              <div>
                <button className="btn danger" onClick={() => handleUnsave(w.item_id)}>Remove</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}