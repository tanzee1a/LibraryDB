import React, { useState, useEffect } from 'react';
import { IoHeartOutline, IoHourglassOutline } from 'react-icons/io5'; // Add hourglass for holds

export default function Wishlist() {
  const [holds, setHolds] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([
      fetch('http://localhost:5000/api/my-holds').then(r => r.ok ? r.json() : Promise.reject('Failed holds fetch')),   // Fetch holds
      fetch('http://localhost:5000/api/my-wishlist').then(r => r.ok ? r.json() : Promise.reject('Failed wishlist fetch')) // Fetch wishlist
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
  }, []);

  // --- Handle Remove from Wishlist ---
  const handleUnsave = (itemId) => {
    fetch(`http://localhost:5000/api/wishlist/${itemId}`, { method: 'DELETE' }) // Call unsave
      .then(r => { if (!r.ok) throw new Error('Unsave failed'); return r.json(); })
      .then(() => {
         // Re-fetch both lists to update UI
         // (A more optimized way would be to filter the state directly)
         setLoading(true); // Show loading briefly
         Promise.all([
           fetch('http://localhost:5000/api/my-holds').then(r => r.json()),
           fetch('http://localhost:5000/api/my-wishlist').then(r => r.json())
         ])
         .then(([holdsData, wishlistData]) => {
            setHolds(holdsData || []);
            setWishlistItems(wishlistData || []);
            setLoading(false);
          });
      })
      .catch((err) => {
        console.error("Unsave Item Error:", err);
        alert(`Error removing item: ${err.message}`);
      });
  };

  // --- Render Logic ---
  if (loading) return <div>Loading items…</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      {/* Section for Holds (Pending Pickup) */}
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
              <div className="thumb-icon" aria-hidden="true"><IoHourglassOutline /></div>
              <div>
                <div className="item-title">{h.title}</div>
                <div className="item-sub">Requested: {new Date(h.created_at).toLocaleDateString()}</div>
                <div className="item-sub">Pickup Expires: {new Date(h.expires_at).toLocaleDateString()}</div>
              </div>
              <div>
                 {/* TODO: Add a Cancel Hold button? */}
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
              <div className="thumb-icon" aria-hidden="true"><IoHeartOutline /></div>
              <div>
                <div className="item-title">{w.title}</div>
                <div className="item-sub">Saved: {new Date(w.created_at).toLocaleDateString()}</div>
              </div>
              <div>
                <button className="btn danger" onClick={() => handleUnsave(w.item_id)}>Remove</button>
                 {/* TODO: Add a "Request Pickup" button if available? */}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}