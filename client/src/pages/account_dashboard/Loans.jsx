import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// Remove IoBookOutline if no longer needed
// --- ADD THIS LINE AT THE TOP of Loans.jsx ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; 
// --- END ADD ---
export default function Loans() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- Fetch Loans ---
  const fetchLoans = () => {
    // 1. Retrieve the token from storage
    const token = localStorage.getItem('authToken'); 

    if (!token) {
        console.error("Authentication Error: No token found. User needs to log in.");
        setError('Please log in to view your borrow history.');
        setLoading(false);
        return; 
    }

    // 2. Construct the headers object with the Authorization header
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // 🔑 KEY FIX: Attach the token
    };

    setLoading(true);
    setError(''); 
    fetch(`${API_BASE_URL}/api/my-loans`, { headers })
      .then(r => { if (!r.ok) throw new Error('Network response was not ok'); return r.json(); })
      .then(data => { setItems(data || []); setLoading(false); })
      .catch((err) => { console.error("Fetch Loans Error:", err); setError('Could not load loans.'); setLoading(false); });
  };

  useEffect(() => {
    fetchLoans();
  }, []); 

  // --- REMOVED handleReturn function ---

  // --- Render Logic ---
  if (loading) return <div>Loading your borrowed items…</div>;
  if (error) return <div>{error}</div>;
  if (!items.length) return <div>No current loans.</div>;

  return (
    <ul className="list">
      {items.map(item => {
        const due = item.due_date; 
        return (
          <li key={item.borrow_id} className="list-item">
            {/* Replace Icon with Image */}
            <img 
              src={item.thumbnail_url || '/placeholder-image.png'} // Use thumbnail or a placeholder
              alt={item.title} 
              className="thumb" // Use 'thumb' class from AccountDashboard.css
              onError={(e) => { e.target.onerror = null; e.target.src='/placeholder-image.png'; }} // Handle broken image links
            />
            <div>
              <div className="item-title">{item.title}</div>
              <div className="item-sub">Due by {new Date(due).toLocaleDateString()}</div>
            </div>
            {/* --- REMOVED BUTTONS --- */}
            <div>
              {/* No buttons needed here for patrons */}
            </div>
          </li>
        );
      })}
    </ul>
  );
}