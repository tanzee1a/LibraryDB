import React from 'react';
import { IoWalletOutline } from 'react-icons/io5';

export default function Fines() {
  // Wire this to your API when ready
  const fines = [];

  if (!fines.length) {
    return (
      <div className="list-item" style={{padding: '8px 0'}}>
        <div className="thumb-icon" aria-hidden="true"><IoWalletOutline /></div>
        <div>No outstanding fines. 🎉</div>
      </div>
    );
  }

  return (
    <ul className="list">
      {fines.map(f => (
        <li key={f.fine_id} className="list-item">
          <div className="thumb-icon" aria-hidden="true"><IoWalletOutline /></div>
          <div>
            <div className="item-title">Fine #{f.fine_id}</div>
            <div className="item-sub">{new Date(f.date_issued).toLocaleDateString()} · ${f.amount}</div>
          </div>
          <div>
            <button className="btn primary">Pay</button>
          </div>
        </li>
      ))}
    </ul>
  );
}