// Holds.jsx
import React, { useState, useEffect } from 'react';
import { IoHourglassOutline } from 'react-icons/io5';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; 

export default function Holds() {
  const [holds, setHolds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Helper function to get headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    if (!token) return null; 

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Fetch Holds
  const fetchHolds = () => {
    const headers = getAuthHeaders();

    if (!headers) {
        console.error("Authentication Error: No token found.");
        setError('Please log in to view your items.');
        setLoading(false);
        return; 
    }

    setLoading(true);
    setError('');
    fetch(`${API_BASE_URL}/api/my-holds`, { headers })
      .then(r => {
        if (r.ok) return r.json();
        throw new Error('Failed to fetch holds');
      })
      .then(holdsData => {
        setHolds(holdsData || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch Holds Error:", err);
        setError('Could not load your holds.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHolds();
  }, []);

  // --- Render Logic ---
  if (loading) return <div>Loading holds…</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      {/* This h4 is optional, you may want to control it in the dashboard */}
      {/* <h4>Requested for Pickup</h4> */}
      {holds.length === 0 ? (
        <div className="list-item" style={{ padding: '8px 0' }}>
          <div className="thumb-icon" aria-hidden="true"><IoHourglassOutline /></div>
          <div>No items currently requested for pickup.</div>
        </div>
      ) : (
        <ul className="list">
          {holds.map(h => (
            <li key={`hold-${h.hold_id}`} className="list-item">
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
    </div>
  );
}