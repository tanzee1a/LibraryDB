import React from 'react';
import { IoTimeOutline } from 'react-icons/io5';

export default function BorrowHistory() {
  // Replace with API data
  const history = [];

  if (!history.length) {
    return (
      <div className="list-item" style={{padding: '8px 0'}}>
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
            <div className="item-sub">Borrowed {b.borrow_date} · Returned {b.return_date || '—'}</div>
          </div>
          <div>
            <button className="btn">Borrow Again</button>
          </div>
        </li>
      ))}
    </ul>
  );
}