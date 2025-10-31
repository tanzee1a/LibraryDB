import React, { useState, useEffect } from 'react';
import { IoTimeOutline } from 'react-icons/io5';
import './AccountDashboard.css';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; 

export default function BorrowHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Retrieve the token from storage
    const token = localStorage.getItem('authToken'); 

    if (!token) {
        console.error("Authentication Error: No token found. User needs to log in.");
        setError('Please log in to view your loan history.');
        setLoading(false);
        return; 
    }

    // Construct the headers object with the Authorization header
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    fetch(`${API_BASE_URL}/api/my-history`, { headers })
      .then(r => { if (!r.ok) throw new Error('Network response was not ok'); return r.json(); })
      .then(data => { setHistory(data || []); setLoading(false); })
      .catch((err) => { console.error("Fetch History Error:", err); setError('Could not load loan history.'); setLoading(false); });
  }, []);

  if (loading) return <div>Loading loan history…</div>;
  if (error) return <div>{error}</div>;
  if (!history.length) {
    return (
      <div className="list-item" style={{ padding: '8px 0' }}>
        <div className="thumb-icon" aria-hidden="true"><IoTimeOutline /></div> 
        <div>You haven't borrowed a book yet. Start reading today!</div>
      </div>
    );
  }

  return (
    <ul className="list">
      {history.map(borrow => (
        <li key={borrow.borrow_id} className="list-item">
          <img 
              src={borrow.thumbnail_url || '/placeholder-image.png'} 
              alt={borrow.title} 
              className="thumb"
              onError={(e) => { e.target.onerror = null; e.target.src='/placeholder-image.png'; }}
            />
          <div>
            <div className="item-title"><a className='result-link' href={`/item/${borrow.item_id}`}>{borrow.title}</a></div>
            <div className="item-sub">
              Returned: {borrow.return_date ? new Date(borrow.return_date).toLocaleDateString() : '—'} 
              {borrow.status_name === 'Lost' && ' (Marked as Lost)'} 
            </div>
          </div>
          <div>
          </div>
        </li>
      ))}
    </ul>
  );
}