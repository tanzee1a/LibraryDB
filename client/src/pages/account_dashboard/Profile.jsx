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
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [passwordChangeMessage, setPasswordChangeMessage] = useState({ type: '', text: '' });

  const [emailForm, setEmailForm] = useState({
    newEmail: '',
    confirmNewEmail: ''
  });
  const [emailChangeMessage, setEmailChangeMessage] = useState({ type: '', text: '' });


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
  const [membershipErrors, setMembershipErrors] = new useState({});

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

    function handlePasswordChange(e) {
    e.preventDefault();
    setPasswordChangeMessage({ type: '', text: '' });

    const { currentPassword, newPassword, confirmNewPassword } = passwordForm;

    if (newPassword !== confirmNewPassword) {
        setPasswordChangeMessage({ type: 'error', text: 'New password and confirmation do not match.' });
        return;
    }

    const token = getToken();
    if (!token) return;
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    const body = JSON.stringify({ 
        currentPassword, 
        newPassword // Only send necessary fields
    });

    fetch(`${API_BASE_URL}/api/my-profile/change-password`, {
        method: 'POST',
        headers,
        body,
    })
    .then(async res => {
        const data = await res.json();
        if (!res.ok) {
            // Backend sends 401 for incorrect current password or 500 for server error
            throw new Error(data.message || 'Failed to change password.');
        }
        return data;
    })
    .then(data => {
        setPasswordChangeMessage({ type: 'success', text: 'Password updated successfully!' });
        // Clear the form after success
        setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    })
    .catch(err => {
        console.error("Password change error:", err);
        setPasswordChangeMessage({ type: 'error', text: err.message || 'An unexpected error occurred.' });
    }); 
  }

   // --- NEW RENDER FUNCTION ---
  function renderPasswordChangeSection() {
      if (user?.role === 'Staff' || user?.role === 'Admin') {
          return <p className='small-spacing'>Staff password management is handled internally.</p>;
      }

      return (
          <>
              <p className='small-spacing'>Update your account password below.</p>
              <form className="info-form" onSubmit={handlePasswordChange}>
                  <input
                      className="input-field"
                      type="password"
                      placeholder="Current Password"
                      value={passwordForm.currentPassword}
                      onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      required
                  />
                  <input
                      className="input-field"
                      type="password"
                      placeholder="New Password"
                      value={passwordForm.newPassword}
                      onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      required
                  />
                  <input
                      className="input-field"
                      type="password"
                      placeholder="Confirm New Password"
                      value={passwordForm.confirmNewPassword}
                      onChange={e => setPasswordForm({...passwordForm, confirmNewPassword: e.target.value})}
                      required
                  />
                  {passwordChangeMessage.text && (
                      <p style={{ color: passwordChangeMessage.type === 'error' ? 'red' : 'green' }}>
                          {passwordChangeMessage.text}
                      </p>
                  )}
                  <button type="submit" className="btn secondary-button">Change Password</button>
              </form>
          </>
      );
    }

    function handleEmailChange(e) {
      e.preventDefault();
      setEmailChangeMessage({ type: '', text: '' });
  
      const { newEmail, confirmNewEmail } = emailForm;
  
      if (newEmail !== confirmNewEmail) {
          setEmailChangeMessage({ type: 'error', text: 'New email and confirmation do not match.' });
          return;
      }
      if (!newEmail || newEmail.length < 5 || !newEmail.includes('@')) {
          setEmailChangeMessage({ type: 'error', text: 'Please enter a valid email address.' });
          return;
      }
  
      const token = getToken();
      if (!token) return;
      
      const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
      };
  
      const body = JSON.stringify({ newEmail });
  
      fetch(`${API_BASE_URL}/api/my-profile/email`, { // <-- NEW ENDPOINT
          method: 'POST',
          headers,
          body,
      })
      .then(async res => {
          const data = await res.json();
          if (!res.ok) {
              // Backend sends 400 for duplicate/invalid email or 500
              throw new Error(data.message || 'Failed to change email.');
          }
          return data;
      })
      .then(data => {
          // Success: Clear form, show message, and recommend logging back in
          setEmailChangeMessage({ 
              type: 'success', 
              text: data.message || 'Email updated successfully. Please log out and log back in with your new email.' 
          });
          setEmailForm({ newEmail: '', confirmNewEmail: '' });
          // Optionally: localStorage.removeItem('authToken'); navigate('/login'); for immediate logout
      })
      .catch(err => {
          console.error("Email change error:", err);
          setEmailChangeMessage({ type: 'error', text: err.message || 'An unexpected error occurred.' });
      }); 
  }

  // UserProfile.jsx (after renderPasswordChangeSection)

function renderEmailChangeSection() {
  // Prevent staff from using this form, as their email might be tied to internal systems.
  if (user?.role === 'Staff' || user?.role === 'Admin') {
      return <p className='small-spacing'>Staff email updates are handled by administration.</p>;
  }

  if (user?.role === 'Student' || user?.role === 'Faculty') {
    return (
        <div className='email-denied-message'>
            <p className='small-spacing' style={{ color: '#c0392b', fontWeight: 'bold' }}>
                Email changes are restricted for your '{user.role}' account type.
            </p>
            <p className='small-spacing'>
                Please contact your Assistant Librarian to modify your primary email address.
            </p>
        </div>
    );
}

  return (
      <>
          <p className='small-spacing'>Update your account email below.</p>
          <form className="info-form" onSubmit={handleEmailChange}>
              <input
                  className="input-field"
                  type="email"
                  placeholder="New Email Address"
                  value={emailForm.newEmail}
                  onChange={e => setEmailForm({...emailForm, newEmail: e.target.value})}
                  required
              />
              <input
                  className="input-field"
                  type="email"
                  placeholder="Confirm New Email"
                  value={emailForm.confirmNewEmail}
                  onChange={e => setEmailForm({...emailForm, confirmNewEmail: e.target.value})}
                  required
              />
              {emailChangeMessage.text && (
                  <p style={{ color: emailChangeMessage.type === 'error' ? 'red' : 'green' }}>
                      {emailChangeMessage.text}
                  </p>
              )}
              <button type="submit" className="btn secondary-button">Update Email</button>
          </form>
      </>
  );
}

  function handleMembershipSignup(e) {
    e.preventDefault();

    // 1. Clear old errors
    setMembershipErrors({});

    // 2. Validate the form
    const errors = validateMembershipForm();
    
    // 3. If there are errors, update state and stop
    if (Object.keys(errors).length > 0) {
      setMembershipErrors(errors);
      return; // Stop the submission
    }

    // --- 4. THIS IS THE LOGIC THAT WAS IN THE WRONG PLACE ---
    // Get the data we need for the UI *before* the fetch
    const lastFour = membershipForm.cardNumber.slice(-4);
    
    // Convert the "MM/YY" string into a full ISO date string
    const [expMonth, expYear] = membershipForm.expDate.split('/');
    const newExpiryDateISO = new Date(
        Number(`20${expYear}`), 
        Number(expMonth), 
        0 
    ).toISOString();
    // --- End of new logic ---


    // 5. Submit new membership details to backend
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
      
      // *** 6. THE FIX for "XXXX" ***
      // Use the API response if it exists,
      // otherwise fall back to the form data we saved.
      setMembershipInfo({
        cardNumber: data.card_last_four || lastFour, 
        expireDate: data.expires_at || newExpiryDateISO 
      });

      // Clear the form fields for security/UX
      setMembershipForm({
        name: '',
        cardNumber: '',
        expDate: '',
        cvv: '',
        billingAddress: '',
      });
    })
    .catch(err => {
      console.error(err);
      alert('Failed to sign up membership. Please try again.');
    });
  }

const handleMembershipFormChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // 1. Card Number: Only allow digits, max 16
    if (name === 'cardNumber') {
      processedValue = value.replace(/\D/g, '').slice(0, 16);
    }

    // 2. CVV: Only allow digits, max 4 (for Amex)
    if (name === 'cvv') {
      processedValue = value.replace(/\D/g, '').slice(0, 4);
    }

    // 3. Expiry Date: Format as MM/YY
    if (name === 'expDate') {
      processedValue = value
        .replace(/\D/g, '') // Remove non-digits
        .replace(/(\d{2})(\d)/, '$1/$2') // Add slash after first 2 digits
        .slice(0, 5); // Max 5 chars (MM/YY)
    }

    // Update the form state
    setMembershipForm(prevForm => ({
      ...prevForm,
      [name]: processedValue
    }));

    // Clear the error for this field as the user types
    if (membershipErrors[name]) {
      setMembershipErrors(prevErrors => ({
        ...prevErrors,
        [name]: null
      }));
    }
  };

  const validateMembershipForm = () => {
    const errors = {};
    const { name, cardNumber, expDate, cvv, billingAddress } = membershipForm;

    // Basic "required" checks (though 'required' on input helps)
    if (!name) errors.name = 'Name on card is required.';
    if (!billingAddress) errors.billingAddress = 'Billing address is required.';

    // Card Number: 13-16 digits
    if (cardNumber.length < 13 || cardNumber.length > 16) {
      errors.cardNumber = 'Card number must be 13-16 digits.';
    }

    // CVV: 3-4 digits
    if (cvv.length < 3 || cvv.length > 4) {
      errors.cvv = 'CVV must be 3 or 4 digits.';
    }

    // Expiry Date: Check format and ensure it's not in the past
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expDate)) {
      errors.expDate = 'Must be in MM/YY format (e.g., 05/26).';
    } else {
      const [month, year] = expDate.split('/');
      // Get the last day of the expiry month
      const lastDayOfExpiryMonth = new Date(Number(`20${year}`), Number(month), 0);
      const today = new Date();

      if (lastDayOfExpiryMonth < today) {
        errors.expDate = 'Card is expired.';
      }
    }

    return errors;
  };

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
    // A simple helper style for errors
    const errorStyle = { color: 'red', fontSize: '0.9em', marginTop: '-5px' };

    return (
      <form className="info-form" onSubmit={handleMembershipSignup}>
          <input
            className="input-field"
            type="text"
            placeholder="Name on Card"
            name="name" // <-- ADD NAME
            value={membershipForm.name}
            onChange={handleMembershipFormChange} // <-- USE NEW HANDLER
            required
          />
          {membershipErrors.name && <p style={errorStyle}>{membershipErrors.name}</p>}

          <input
            className="input-field"
            type="text" // <-- Use "text" to allow our formatting
            placeholder="Card Number"
            name="cardNumber" // <-- ADD NAME
            value={membershipForm.cardNumber}
            onChange={handleMembershipFormChange} // <-- USE NEW HANDLER
            required
          />
          {membershipErrors.cardNumber && <p style={errorStyle}>{membershipErrors.cardNumber}</p>}

          <div className='flex'>
            {/* Wrap inputs in a div to keep error messages with them */}
            <div style={{ flex: 1, marginRight: '5px' }}>
              <input
                className="input-field input-field-small"
                type="text" // <-- Use "text" for MM/YY
                placeholder="Exp Date (MM/YY)"
                name="expDate" // <-- ADD NAME
                value={membershipForm.expDate}
                onChange={handleMembershipFormChange} // <-- USE NEW HANDLER
                required
              />
              {membershipErrors.expDate && <p style={errorStyle}>{membershipErrors.expDate}</p>}
            </div>

            <div style={{ flex: 1, marginLeft: '5px' }}>
              <input
                className="input-field input-field-small"
                type="text" // <-- Use "text"
                placeholder="CVV"
                name="cvv" // <-- ADD NAME
                value={membershipForm.cvv}
                onChange={handleMembershipFormChange} // <-- USE NEW HANDLER
                required
              />
              {membershipErrors.cvv && <p style={errorStyle}>{membershipErrors.cvv}</p>}
            </div>
          </div>
          <input
            className="input-field"
            type="text"
            placeholder="Billing Address"
            name="billingAddress" // <-- ADD NAME
            value={membershipForm.billingAddress}
            onChange={handleMembershipFormChange} // <-- USE NEW HANDLER
            required
          />
          {membershipErrors.billingAddress && <p style={errorStyle}>{membershipErrors.billingAddress}</p>}

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
      {user.role !== 'Student' && user.role !== 'Faculty' && (
        <div className='membership-info'>
          <h3>Membership</h3>
          {renderMembershipSection()}
        </div>
      )}
      <div className='membership-info'>
          <h3>Password</h3>
          {renderPasswordChangeSection()}
      </div>
      <div className='membership-info'>
        <h3>Email</h3>
        {renderEmailChangeSection()}
      </div>
    </div>
  );
}