import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoPersonCircleOutline } from 'react-icons/io5';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; 
export default function UserProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // const [membershipStatus, setMembershipStatus] = useState('expired'); // new, active, canceled, expired
  const [membershipStatus, setMembershipStatus] = useState(null); // <-- Set to null initially
  const [membershipInfo, setMembershipInfo] = useState(null); // <-- Store membership details

// const membershipSample = { ... } // <-- REMOVE THIS
/*
  const membershipSample = {
    status: 'active', // 'active', 'canceled', 'expired'
    cardNumber: '1234567891234',
    signupDate: '2024-01-15T12:00:00Z',
    expireDate: '2024-02-15T12:00:00Z',
  }
*/
  // Membership form state
  const [membershipForm, setMembershipForm] = useState({
    name: '',
    cardNumber: '',
    expDate: '',
    cvv: '',
    billingAddress: '',
  });

  const getToken = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.error("Authentication Error: No token found. User needs to log in.");
        setLoading(false);
        navigate('/login');
        return null;
    }
    return token;
  }

   // Add this helper function inside your Profile component
function getStatusFromData(data) {
    if (!data.membership_status) {
        return 'new'; // User has never had a membership
    }

    const isExpired = new Date(data.expires_at) < new Date();

    if (isExpired) {
        return 'expired';
    }

    if (data.membership_status === 'ACTIVE' && data.auto_renew === 0) {
        return 'canceled';
    }

    if (data.membership_status === 'ACTIVE') {
        return 'active';
    }

    return 'expired'; // Default fallback
}


  useEffect(() => {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
      // KEY FIX: Attach the token to authorize the request
      'Authorization': `Bearer ${token}` 
    };
    // NOTE: You need to create this '/api/my-profile' endpoint on the backend!
    fetch(`${API_BASE_URL}/api/my-profile`, { headers })
    .then(res => res.ok ? res.json() : Promise.reject('Failed fetch'))
      .then(data => {
        setUser(data);
        setMembershipStatus(data.membership_status); // <-- Use backend status
        setMembershipInfo({ // Store the details for rendering
          cardNumber: data.card_last_four,
          expireDate: data.expires_at
        });
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch profile error:", err);
        setLoading(false);
      });
  }, []);


  function handleMembershipSignup(e) {
    e.preventDefault();
    // Submit new membership details to backend
    const token = getToken();
    if (!token) return;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    const body = JSON.stringify(membershipForm);
    fetch(`${API_BASE_URL}/api/membership/signup`, {
      method: 'POST',
      headers,
      body,
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to sign up membership');
      return res.json();
    })
    .then(data => {
      setMembershipStatus('active');
      // Optionally update user membership info here
    })
    .catch(err => {
      console.error(err);
      alert('Failed to sign up membership. Please try again.');
    });
  }

  function handleCancelMembership() {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    fetch(`${API_BASE_URL}/api/membership/cancel`, {
      method: 'POST',
      headers,
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to cancel membership');
      return res.json();
    })
    .then(data => {
      setMembershipStatus('canceled');
    })
    .catch(err => {
      console.error(err);
      alert('Failed to cancel membership. Please try again.');
    });
  }

  function handleRenewMembership() {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    fetch(`${API_BASE_URL}/api/membership/renew`, {
      method: 'POST',
      headers,
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to renew membership');
      return res.json();
    })
    .then(data => {
      setMembershipStatus('active');
    })
    .catch(err => {
      console.error(err);
      alert('Failed to renew membership. Please try again.');
    });
  }

  function renderMembershipForm() {
    return (
      <form className="info-form" onSubmit={handleMembershipSignup}>
          <input
            className="input-field"
            type="text"
            placeholder="Name on Card"
            value={membershipForm.name}
            onChange={e => setMembershipForm({...membershipForm, name: e.target.value})}
            required
          />
          <input
            className="input-field"
            type="text"
            placeholder="Card Number"
            value={membershipForm.cardNumber}
            onChange={e => setMembershipForm({...membershipForm, cardNumber: e.target.value})}
            required
          />
          <div className='flex'>
            <input
              className="input-field input-field-small"
              type="text"
              placeholder="Exp Date (MM/YY)"
              value={membershipForm.expDate}
              onChange={e => setMembershipForm({...membershipForm, expDate: e.target.value})}
              required
            />
            <input
              className="input-field input-field-small"
              type="text"
              placeholder="CVV"
              value={membershipForm.cvv}
              onChange={e => setMembershipForm({...membershipForm, cvv: e.target.value})}
              required
            />
          </div>
          <input
            className="input-field"
            type="text"
            placeholder="Billing Address"
            value={membershipForm.billingAddress}
            onChange={e => setMembershipForm({...membershipForm, billingAddress: e.target.value})}
            required
          />
          <button type="submit" className="btn primary-button">Sign Up</button>
      </form>
    )
  }

  function renderMembershipSection() {
    switch (membershipStatus) {
      case 'new':
        return (
          <>
            <p>You're almost done! Membership enables you to borrow items.</p>
            {renderMembershipForm()}
          </>
        );
      case 'active': {
        // Use membershipInfo from state, not membershipSample
        const cardEnding = membershipInfo?.cardNumber || 'XXXX'; 
        const expireDate = new Date(membershipInfo?.expireDate || Date.now());
        const nextBillingStr = expireDate.toLocaleDateString();
        
        return (
          <>
            <p>Your membership is active.</p>
            <div className='membership-payment-info'>
              <p className='small-spacing'><strong>Payment method:</strong> Card ending in {cardEnding}</p>
              <p className='small-spacing'><strong>Next billing date:</strong> {nextBillingStr}.</p>
            </div>
            <button className="btn danger" onClick={handleCancelMembership}>Cancel Membership</button>
          </>
        );
      }
      case 'canceled': {
        // Use membershipInfo from state, not membershipSample
        const expireDateC = new Date(membershipInfo?.expireDate || Date.now());
        const expireStr = expireDateC.toLocaleDateString();
        
        return (
          <>
            {/* FIX: Was </Do>, changed to </p> */}
            <p>Your membership is expiring on {expireStr}.</p>
            <button className="btn primary" onClick={handleRenewMembership}>Join Back</button>
          </>
        );
      }
      case 'expired':
        return (
          <>
            <p>Join back to borrow items again.</p>
            {renderMembershipForm()}
          </>
        );
      default:
        // This handles the initial 'null' state while loading
        return <p>Loading membership details...</p>;
    }
  }

  if (loading) {
    return (
      <div className="profile-card">
        <IoPersonCircleOutline className="avatar-icon" aria-hidden="true" />
        <div>Loading profile...</div>
      </div>
    );
  }

  if (!user) {
     return (
       <div className="profile-card">
         <IoPersonCircleOutline className="avatar-icon" aria-hidden="true" />
         <div>Could not load profile.</div>
       </div>
     );
  }

  return (
    <div>
      <div className="item-title">{user.firstName} {user.lastName}</div>
      <div className="profile-meta">User ID: {user.user_id} · {user.email}</div>
      <div className='membership-info'>
        <h3>Membership</h3>
        {renderMembershipSection()}
      </div>
    </div>
  );
}