import React, { useState, useEffect } from 'react';
import { IoWalletOutline } from 'react-icons/io5';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; 
const Fines = () => {
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Fetch Fines ---
  const fetchFines = () => {
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
    setError(null);
    fetch('${API_BASE_URL}/api/my-fines', { headers }) // Fetch from your fines endpoint
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch fines');
        return res.json();
       })
      .then(data => {
        setFines(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch fines:", err);
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFines();
  }, []); 

  // --- Handle Pay Button Click ---
  const handlePayFine = (fineId) => {
    fetch(`${API_BASE_URL}/api/fines/${fineId}/pay`, { method: 'POST' }) // Call pay endpoint
      .then(res => {
        if (!res.ok) throw new Error('Payment failed');
        return res.json();
      })
      .then(() => {
        fetchFines(); // Refresh list after paying
      })
      .catch(err => {
        console.error("Failed to pay fine:", err);
        alert(`Error: ${err.message}`); 
      });
  };

  // --- Render Logic ---
  if (loading) return <div className="dashboard-section"><h3>Fines</h3><p>Loading fines...</p></div>;
  if (error) return <div className="dashboard-section"><h3>Fines</h3><p>Error loading fines: {error}</p></div>;

  const unpaidFines = fines.filter(fine => !fine.date_paid && !fine.waived_at);
  const paidFines = fines.filter(fine => fine.date_paid || fine.waived_at);

  return (
    <div className="dashboard-section">
      <h3>Outstanding Fines</h3>
      {unpaidFines.length === 0 ? (
        <p>You have no outstanding fines!</p>
      ) : (
        <ul className="list">
          {unpaidFines.map(fine => (
            <li key={fine.fine_id} className="list-item">
              <div className="thumb-icon" aria-hidden="true"><IoWalletOutline /></div>
              <div>
                  <div className="item-title">${Number(fine.amount).toFixed(2)} - {fine.fee_type}</div>
                 <div className="item-sub">For: {fine.item_title} (Issued: {new Date(fine.date_issued).toLocaleDateString()})</div>
                 {fine.notes && <div className="item-sub">Note: {fine.notes}</div>}
              </div>
              <div>
                <button 
                  onClick={() => handlePayFine(fine.fine_id)} 
                  className="btn primary"
                >
                  Pay Fine
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {paidFines.length > 0 && (
        <>
          <h4 style={{ marginTop: '20px' }}>Paid / Waived Fines</h4>
          <ul className="list">
            {paidFines.map(fine => (
               <li key={fine.fine_id} className="list-item" style={{ opacity: 0.6 }}>
                 <div className="thumb-icon" aria-hidden="true"><IoWalletOutline /></div>
                 <div>
                    <div className="item-title">${Number(fine.amount).toFixed(2)} - {fine.fee_type}</div>
                    <div className="item-sub">For: {fine.item_title}</div>
                    <div className="item-sub">
                     {fine.waived_at 
                       ? `Waived: ${new Date(fine.waived_at).toLocaleDateString()} (${fine.waived_reason || 'No reason'})` 
                       : `Paid: ${new Date(fine.date_paid).toLocaleDateString()}`}
                    </div>
                 </div>
               </li>
             ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default Fines;