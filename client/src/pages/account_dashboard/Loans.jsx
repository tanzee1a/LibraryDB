import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; 

export default function Loans() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLoans = () => {
    const token = localStorage.getItem('authToken'); 

    if (!token) {
        console.error("Authentication Error: No token found. User needs to log in.");
        setError('Please log in to view your borrow history.');
        setLoading(false);
        return; 
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
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


  if (loading) return <div>Loading your borrowed items…</div>;
  if (error) return <div>{error}</div>;
  if (!items.length) return <div>No current loans.</div>;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <ul className="list">
      {items.map(item => {
        const due = item.due_date; 
        
        const dueDate = new Date(due);
        
        const isOverdue = dueDate < today;

        return (
          // <li key={item.borrow_id} className={`list-item ${isOverdue ? 'overdue-item' : ''}`}>
          <li key={item.borrow_id} className="list-item">
            <img 
              src={item.thumbnail_url || '/placeholder-image.png'} 
              alt={item.title} 
              className="thumb" 
              onError={(e) => { e.target.onerror = null; e.target.src='/placeholder-image.png'; }} 
            />
            <div>
              <div className="item-title"><a className='result-link' href={`/item/${item.item_id}`}>{item.title}</a></div>
              <div className="item-sub">
                Due by {new Date(due).toLocaleDateString()}
                
                {isOverdue && <span className="overdue-alert">OVERDUE</span>}
              
              </div>
            </div>
            <div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}