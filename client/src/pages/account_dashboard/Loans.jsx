import React, { useState, useEffect } from 'react';
import { IoBookOutline } from 'react-icons/io5';

export default function Loans() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- Fetch Loans ---
  const fetchLoans = () => {
    setLoading(true);
    setError(''); // Reset error on refetch
    fetch('http://localhost:5000/api/my-loans') // Or your Render URL
      .then(r => { if (!r.ok) throw new Error('Network response was not ok'); return r.json(); })
      .then(data => { setItems(data || []); setLoading(false); })
      .catch((err) => { console.error("Fetch Loans Error:", err); setError('Could not load loans.'); setLoading(false); });
  };

  useEffect(() => {
    fetchLoans();
  }, []); // Fetch on mount

  // --- Handle Return ---
  const handleReturn = (borrowId) => {
    // NOTE: In a real app, this is a STAFF action. We simulate it here.
    fetch(`http://localhost:5000/api/return/${borrowId}`, { method: 'POST' }) // Or Render URL
      .then(r => { if (!r.ok) throw new Error('Return failed'); return r.json(); })
      .then(() => {
        alert('Item marked for return!'); // Simple feedback
        fetchLoans(); // Refresh the list after returning
      })
      .catch((err) => {
        console.error("Return Item Error:", err);
        alert(`Error returning item: ${err.message}`);
      });
  };

  // --- Render Logic ---
  if (loading) return <div>Loading your borrowed items…</div>;
  if (error) return <div>{error}</div>;
  if (!items.length) return <div>No current loans.</div>;

  return (
    <ul className="list">
      {items.map(item => {
        // Use due_date from the updated schema
        const due = item.due_date; 
        return (
          <li key={item.borrow_id} className="list-item">
            <div className="thumb-icon" aria-hidden="true"><IoBookOutline /></div>
            <div>
              <div className="item-title">{item.title}</div>
              <div className="item-sub">Due by {new Date(due).toLocaleDateString()}</div>
            </div>
            <div>
              {/* Add onClick handler to the button */}
              <button className="btn success" onClick={() => handleReturn(item.borrow_id)}>
                Return
              </button>
              {/* Report Issue button - functionality not implemented yet */}
              <button className="btn warn">Report Issue</button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}