import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoPersonCircleOutline } from 'react-icons/io5';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; 

// NOTE: This component is for staff to see their OWN profile.
export default function StaffProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State for Password Change Form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [passwordChangeMessage, setPasswordChangeMessage] = useState({ type: '', text: '' });
  
  // Function to retrieve authentication token
  const getToken = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.error("Authentication Error: No token found. Staff needs to log in.");
        setLoading(false);
        navigate('/staff-login'); // Redirect staff to staff login page
        return null;
    }
    return token;
  }


  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const headers = {
      'Content-Type': 'application/json',
      // Attach the token for authentication
      'Authorization': `Bearer ${token}` 
    };
    
    // 💡 KEY CHANGE: Use the staff-specific endpoint
    // (This endpoint should return user details + staffRole)
    fetch(`${API_BASE_URL}/api/staff/my-profile`, { headers })
    .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch staff profile'))
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch staff profile error:", err);
        setLoading(false);
        // Optional: Navigate to an error page if fetching fails
      });
  }, [navigate]);

  // Handle the password change logic (same as UserProfile)
  function handlePasswordChange(e) {
    e.preventDefault();
    setPasswordChangeMessage({ type: '', text: '' });

    const { currentPassword, newPassword, confirmNewPassword } = passwordForm;

    if (newPassword !== confirmNewPassword) {
        setPasswordChangeMessage({ type: 'error', text: 'New password and confirmation do not match.' });
        return;
    }

    // Basic password strength check (optional)
    if (newPassword.length < 6) {
        setPasswordChangeMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
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
        newPassword 
    });

    // 💡 NOTE: The endpoint is the same as it is user-specific, but the 
    // staff member's JWT token will grant them access.
    fetch(`${API_BASE_URL}/api/my-profile/change-password`, {
        method: 'POST',
        headers,
        body,
    })
    .then(async res => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.message || 'Failed to change password.');
        }
        return data;
    })
    .then(data => {
        setPasswordChangeMessage({ type: 'success', text: 'Password updated successfully!' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    })
    .catch(err => {
        console.error("Password change error:", err);
        setPasswordChangeMessage({ type: 'error', text: err.message || 'An unexpected error occurred.' });
    }); 
  }


  // Render the Password Change Form
  function renderPasswordChangeSection() {
      // NOTE: We don't need the role check here since this is explicitly the Staff profile page
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
  
  // --- Loading and Error States ---
  if (loading) {
    return (
      <div 
        // 💡 ADDED STYLE: Pushes content down past a fixed nav/header (adjust 80px as needed)
        style={{ marginTop: '80px', padding: '20px' }} 
        className="profile-card"
      >
        <IoPersonCircleOutline className="avatar-icon" aria-hidden="true" />
        <div>Loading Staff profile...</div>
      </div>
    );
  }

  if (!user) {
     return (
       <div 
         // 💡 ADDED STYLE: Pushes content down past a fixed nav/header (adjust 80px as needed)
         style={{ marginTop: '80px', padding: '20px' }} 
         className="profile-card"
       >
         <IoPersonCircleOutline className="avatar-icon" aria-hidden="true" />
         <div>Could not load Staff profile. Please log in again.</div>
       </div>
     );
  }

  // --- Main Render ---
  return (
    // 💡 ADDED WRAPPER DIV WITH INLINE STYLE
    <div style={{ marginTop: '80px', padding: '20px' }}> 
      <div className="item-title">Staff Profile: {user.firstName} {user.lastName}</div>
      <div className="profile-meta">
        Email: {user.email}
      </div>
      <hr/>

      <div className='password-section'>
          <h3>Change Password</h3>
          {renderPasswordChangeSection()}
      </div>
    </div>
  );
}