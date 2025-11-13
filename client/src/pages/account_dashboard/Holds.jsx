// Holds.jsx
import React, { useState, useEffect } from 'react';
import { IoHourglassOutline } from 'react-icons/io5';
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; 

export default function Holds() {
  const [holds, setHolds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State for the cancel operation
  const [cancelingId, setCancelingId] = useState(null); // Tracks which hold is being canceled
  const [cancelError, setCancelError] = useState(''); // For cancel-specific errors

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

  // Function to handle canceling a hold
  const handleCancelHold = async (holdId) => {
    const headers = getAuthHeaders();
    if (!headers) {
        setCancelError('Authentication error. Please log in again.');
        return;
    }

    setCancelingId(holdId); 
    setCancelError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/holds/${holdId}`, {
        method: 'DELETE',
        headers: headers
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to cancel hold.');
      }

      // Success: Remove the hold from the local state
      setHolds(currentHolds => 
        currentHolds.filter(hold => hold.hold_id !== holdId)
      );

    } catch (err) {
      console.error("Cancel Hold Error:", err);
      setCancelError(err.message);
    } finally {
      setCancelingId(null); // Remove loading state
    }
  };

  // --- Render Logic ---
  if (loading) return <div>Loading holds…</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      {cancelError && (
        <div 
          className="error-message" 
          style={{ color: 'red', marginBottom: '15px' }}
        >
          Error: {cancelError}
        </div>
      )}
      {holds.length === 0 ? (
        <div className="list-item" style={{ padding: '8px 0' }}>
          <div className="thumb-icon" aria-hidden="true"><IoHourglassOutline /></div>
          <div>No items currently requested for pickup.</div>
        </div>
      ) : (
        <ul className="list">
          {holds.map(h => (
            <li key={`hold-${h.hold_id}`} className="list-item">
              
              <Link to={`/item/${h.item_id}`}>
                <img 
                  src={h.thumbnail_url || '/placeholder-image.png'} 
                  alt={h.title} 
                  className="thumb"
                  onError={(e) => { e.target.onerror = null; e.target.src='/placeholder-image.png'; }}
                />
              </Link>
              
              <div>
                <Link to={`/item/${h.item_id}`} className="item-title result-link">
                  {h.title}
                </Link>
                
                <div className="item-sub">Requested: {new Date(h.created_at).toLocaleDateString()}</div>
                <div className="item-sub">Pickup Expires: {new Date(h.expires_at).toLocaleDateString()}</div>
              </div>
              <div className="item-actions"> 
                <button
                  className="btn danger"
                  onClick={() => handleCancelHold(h.hold_id)}
                  disabled={cancelingId === h.hold_id} 
                >
                  {cancelingId === h.hold_id ? 'Canceling...' : 'Cancel Hold'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}