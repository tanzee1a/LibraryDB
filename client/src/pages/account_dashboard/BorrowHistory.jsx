import React, { useState, useEffect } from 'react';
import { IoTimeOutline } from 'react-icons/io5';

export default function BorrowHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/my-history') // Fetch from your history endpoint
      .then(r => { if (!r.ok) throw new Error('Network response was not ok'); return r.json(); })
      .then(data => { setHistory(data || []); setLoading(false); })
      .catch((err) => { console.error("Fetch History Error:", err); setError('Could not load borrow history.'); setLoading(false); });
  }, []);

  if (loading) return <div>Loading borrow history…</div>;
  if (error) return <div>{error}</div>;
  if (!history.length) {
    return (
      <div className="list-item" style={{ padding: '8px 0' }}>
        <div className="thumb-icon" aria-hidden="true"><IoTimeOutline /></div>
        <div>Your past borrows will appear here.</div>
      </div>
    );
  }

  return (
    <ul className="list">
      {history.map(b => (
        <li key={b.borrow_id} className="list-item">
          <div className="thumb-icon" aria-hidden="true"><IoTimeOutline /></div>
          <div>
            <div className="item-title">{b.title}</div>
            <div className="item-sub">
              Returned: {b.return_date ? new Date(b.return_date).toLocaleDateString() : '—'} 
              {b.status_name === 'Lost' && ' (Marked as Lost)'} 
            </div>
          </div>
          <div>
             {/* "Borrow Again" button - functionality not implemented yet */}
            <button className="btn">Borrow Again</button>
          </div>
        </li>
      ))}
    </ul>
  );
}