import React, { useState, useEffect } from 'react';
import { IoListOutline } from 'react-icons/io5'; // Changed icon
import { Link } from 'react-router-dom';
import { FaPlus } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function Waitlist() {
    const [waitlist, setWaitlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // State for the cancel operation
    const [cancelingId, setCancelingId] = useState(null); // Tracks which waitlist item is being canceled
    const [cancelError, setCancelError] = useState(''); // For cancel-specific errors

  // --- NEW: State for the "Add" sheet (from manage_fines.jsx) ---
    const [showAddWaitlistSheet, setShowAddWaitlistSheet] = useState(false);
    const initialWaitlistState = {
        email: '',
        itemId: ''
    };
    const [newWaitlistEntry, setNewWaitlistEntry] = useState(initialWaitlistState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    // --- END NEW ---
    
  // Helper function to get headers
  const getAuthHeaders = () => {
    // Using 'authToken' to match Holds.jsx
    const token = localStorage.getItem('authToken'); 
    if (!token) return null;

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Fetch Waitlist
  const fetchWaitlist = () => {
    const headers = getAuthHeaders();

    if (!headers) {
      console.error("Authentication Error: No token found.");
      setError('Please log in to view your waitlist.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    fetch(`${API_BASE_URL}/api/my-waitlist`, { headers }) // Updated API endpoint
      .then(r => {
        if (r.ok) return r.json();
        throw new Error('Failed to fetch waitlist');
      })
      .then(waitlistData => {
        setWaitlist(waitlistData || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch Waitlist Error:", err);
        setError('Could not load your waitlist.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchWaitlist();
  }, []);

  // Function to handle canceling a waitlist spot
  const handleCancelWaitlist = async (waitlistId) => {
    const headers = getAuthHeaders();
    if (!headers) {
      setCancelError('Authentication error. Please log in again.');
      return;
    }

    setCancelingId(waitlistId);
    setCancelError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/my-waitlist/${waitlistId}`, { // Updated API endpoint
        method: 'DELETE',
        headers: headers
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to cancel waitlist entry.');
      }

      // Success: Remove the item from the local state
      setWaitlist(currentWaitlist =>
        currentWaitlist.filter(item => item.waitlist_id !== waitlistId)
      );

    } catch (err) {
      console.error("Cancel Waitlist Error:", err);
      setCancelError(err.message);
    } finally {
      setCancelingId(null); // Remove loading state
    }
  };

  // --- Render Logic ---
  if (loading) return <div>Loading waitlist…</div>;
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
      {waitlist.length === 0 ? (
        <div className="list-item" style={{ padding: '8px 0' }}>
          <div className="thumb-icon" aria-hidden="true"><IoListOutline /></div>
          <div>You are not on any waitlists.</div>
        </div>
      ) : (
        <ul className="list">
          {waitlist.map(w => (
            <li key={`waitlist-${w.waitlist_id}`} className="list-item">

              <Link to={`/item/${w.item_id}`}>
                <img
                  src={w.thumbnail_url || '/placeholder-image.png'}
                  alt={w.title}
                  className="thumb"
                  onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-image.png'; }}
                />
              </Link>

              <div>
                <Link to={`/item/${w.item_id}`} className="item-title result-link">
                  {w.title}
                </Link>

                <div className="item-sub">On waitlist since: {new Date(w.start_date).toLocaleDateString()}</div>
              </div>
              <div className="item-actions">
                <button
                  className="btn danger"
                  onClick={() => handleCancelWaitlist(w.waitlist_id)}
                  disabled={cancelingId === w.waitlist_id}
                >
                  {cancelingId === w.waitlist_id ? 'Canceling...' : 'Cancel Waitlist'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}