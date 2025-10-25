import React, { useState, useEffect } from 'react';
import { IoBookOutline } from 'react-icons/io5';

export default function Loans() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/my-loans')
      .then(r => { if (!r.ok) throw new Error('Network'); return r.json(); })
      .then(data => { setItems(data || []); setLoading(false); })
      .catch(() => { setError('Could not load loans'); setLoading(false); });
  }, []);

  if (loading) return <div>Loading your borrowed items…</div>;
  if (error) return <div>{error}</div>;
  if (!items.length) return <div>No current loans.</div>;

  return (
    <ul className="list">
      {items.map(item => {
        const due = item.dueDate || item.due_date; // accept either shape
        return (
          <li key={item.borrow_id} className="list-item">
            <div className="thumb-icon" aria-hidden="true"><IoBookOutline /></div>
            <div>
              <div className="item-title">{item.title}</div>
              <div className="item-sub">Due by {new Date(due).toLocaleDateString()}</div>
            </div>
            <div>
              <button className="btn success">Return</button>
              <button className="btn warn">Report Issue</button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}