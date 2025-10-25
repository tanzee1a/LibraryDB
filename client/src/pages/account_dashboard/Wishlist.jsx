import React from 'react';
import { IoHeartOutline } from 'react-icons/io5';

export default function Wishlist() {
  const items = [];

  if (!items.length) {
    return (
      <div className="list-item" style={{padding: '8px 0'}}>
        <div className="thumb-icon" aria-hidden="true"><IoHeartOutline /></div>
        <div>Books you save will show up here.</div>
      </div>
    );
  }

  return (
    <ul className="list">
      {items.map(w => (
        <li key={w.id} className="list-item">
          <div className="thumb-icon" aria-hidden="true"><IoHeartOutline /></div>
          <div>
            <div className="item-title">{w.title}</div>
            <div className="item-sub">{w.author}</div>
          </div>
          <div>
            <button className="btn primary">Move to Loans</button>
          </div>
        </li>
      ))}
    </ul>
  );
}