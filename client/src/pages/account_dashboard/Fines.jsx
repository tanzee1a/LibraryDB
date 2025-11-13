import React, { useState, useEffect } from 'react';
import { IoWalletOutline } from 'react-icons/io5';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; 
const Fines = () => {
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New state variables for payment UI
  const [showPayFineSheet, setShowPayFineSheet] = useState(false);
  const [selectedFineId, setSelectedFineId] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState({
    nameOnCard: '',
    cardNumber: '',
    expirationDate: '',
    cvv: '',
    billingAddress: ''
  });
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

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
      'Authorization': `Bearer ${token}` 
    };

    setLoading(true);
    setError(null);
    fetch(`${API_BASE_URL}/api/my-fines`, { headers }) 
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
    // 1. Retrieve the token from storage
    const token = localStorage.getItem('authToken'); 

    if (!token) {
        console.error("Authentication Error: No token found.");
        alert('Error: You must be logged in to pay a fine.');
        return; 
    }

    // 2. Construct the headers object
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 3. Call the new user-specific endpoint
    return fetch(`${API_BASE_URL}/api/my-fines/${fineId}/pay`, { 
      method: 'POST',
      headers: headers
    }) 
      .then(res => {
        if (!res.ok) {
           return res.json().then(errData => {
               throw new Error(errData.message || 'Payment failed');
           });
        }
        return res.json();
      })
      .then(() => {
        fetchFines(); 
      });
  };

  // Handle opening payment sheet
  const openPayFineSheet = (fineId) => {
    setSelectedFineId(fineId);
    setPaymentDetails({
      nameOnCard: '',
      cardNumber: '',
      expirationDate: '',
      cvv: '',
      billingAddress: ''
    });
    setPaymentError(null);
    setShowPayFineSheet(true);
  };

  // Handle input changes in payment form
  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails(prev => ({ ...prev, [name]: value }));
  };

  // Validate payment form fields
  const validatePaymentDetails = () => {
    const { nameOnCard, cardNumber, expirationDate, cvv, billingAddress } = paymentDetails;
    if (!nameOnCard.trim()) return 'Name on Card is required.';
    if (!cardNumber.trim() || !/^\d{13,19}$/.test(cardNumber.replace(/\s+/g, ''))) return 'Valid Card Number is required.';
    if (!expirationDate.trim() || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(expirationDate)) return 'Expiration Date must be in MM/YY format.';
    if (!cvv.trim() || !/^\d{3,4}$/.test(cvv)) return 'Valid CVV is required.';
    if (!billingAddress.trim()) return 'Billing Address is required.';
    return null;
  };

  // Handle payment form submission
  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    const validationError = validatePaymentDetails();
    if (validationError) {
      setPaymentError(validationError);
      return;
    }
    setIsPaying(true);
    setPaymentError(null);

    handlePayFine(selectedFineId)
      .then(() => {
        setShowPayFineSheet(false);
        setIsPaying(false);
      })
      .catch(err => {
        setPaymentError(err.message || 'Payment failed.');
        setIsPaying(false);
      });
  };

  // --- Render Logic ---
  if (loading) return <div className="dashboard-section"><h3>Fines</h3><p>Loading fines...</p></div>;
  if (error) return <div className="dashboard-section"><h3>Fines</h3><p>Error loading fines: {error}</p></div>;

  const unpaidFines = fines.filter(fine => !fine.date_paid && !fine.waived_at);
  const paidFines = fines.filter(fine => fine.date_paid || fine.waived_at);

  return (
    <div>
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
                    onClick={() => openPayFineSheet(fine.fine_id)} 
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

      {/* Payment Sheet Modal */}
      {showPayFineSheet && (
        <div className="sheet-overlay" onClick={() => !isPaying && setShowPayFineSheet(false)}>
          <div className="sheet-container" onClick={(e) => e.stopPropagation()}>
            <h2>Pay Fine</h2>
            {paymentError && <p style={{color: 'red'}}>{paymentError}</p>}
            <form onSubmit={handlePaymentSubmit}>
              <label>
                Name on Card:
                <input
                  type="text"
                  name="nameOnCard"
                  className="edit-input"
                  value={paymentDetails.nameOnCard}
                  onChange={handlePaymentInputChange}
                  required
                />
              </label>
              <label>
                Card Number:
                <input
                  type="text"
                  name="cardNumber"
                  className="edit-input"
                  value={paymentDetails.cardNumber}
                  onChange={handlePaymentInputChange}
                  maxLength="19"
                  placeholder="1234 5678 9012 3456"
                  required
                />
              </label>
              <label>
                Expiration Date (MM/YY):
                <input
                  type="text"
                  name="expirationDate"
                  className="edit-input"
                  value={paymentDetails.expirationDate}
                  onChange={handlePaymentInputChange}
                  maxLength="5"
                  placeholder="MM/YY"
                  required
                />
              </label>
              <label>
                CVV:
                <input
                  type="password"
                  name="cvv"
                  className="edit-input"
                  value={paymentDetails.cvv}
                  onChange={handlePaymentInputChange}
                  maxLength="4"
                  required
                />
              </label>
              <label>
                Billing Address:
                <input
                  type="text"
                  name="billingAddress"
                  className="edit-input"
                  value={paymentDetails.billingAddress}
                  onChange={handlePaymentInputChange}
                  required
                />
              </label>
              <div className="sheet-actions">
                <button type="submit" className="action-button primary-button" disabled={isPaying}>
                  {isPaying ? 'Processing...' : 'Pay Now'}
                </button>
                <button type="button" className="action-button secondary-button" onClick={() => !isPaying && setShowPayFineSheet(false)} disabled={isPaying}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fines;